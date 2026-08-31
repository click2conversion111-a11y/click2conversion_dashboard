import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaInsights, parseInsight } from '@/lib/meta'
import { detectCampaignType } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId')
  const accessToken = searchParams.get('accessToken')
  const datePreset = searchParams.get('datePreset') || 'today'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  if (!accountId || !accessToken) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  try {
    // Account-level summary
    const accountRaw = await fetchMetaInsights({
      accessToken,
      accountId,
      level: 'account',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
    })

    const summary = accountRaw.length > 0 ? parseInsight(accountRaw[0]) : {
      spend: 0, impressions: 0, clicks: 0, purchases: 0,
      revenue: 0, roas: 0, ctr: 0, cpc: 0, cpm: 0, frequency: 0, cpp: 0, aov: 0,
    }

    // Campaign-level for type breakdown + daily chart
    const campaignRaw = await fetchMetaInsights({
      accessToken,
      accountId,
      level: 'campaign',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
      fields: [
        'campaign_id',
        'campaign_name',
        'spend',
        'impressions',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'frequency',
        'actions',
        'action_values',
        'date_start',
        'date_stop',
      ],
    })

    // Type breakdown
    const typeMap: Record<string, ReturnType<typeof parseInsight> & { count: number }> = {}
    for (const r of campaignRaw) {
      const type = detectCampaignType(r.campaign_name || '')
      if (!typeMap[type]) {
        typeMap[type] = { ...parseInsight(r), count: 1 }
      } else {
        const existing = typeMap[type]
        const parsed = parseInsight(r)
        existing.spend += parsed.spend
        existing.revenue += parsed.revenue
        existing.impressions += parsed.impressions
        existing.clicks += parsed.clicks
        existing.purchases += parsed.purchases
        existing.count += 1
        existing.roas = existing.spend > 0 ? existing.revenue / existing.spend : 0
        existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0
        existing.cpc = existing.clicks > 0 ? existing.spend / existing.clicks : 0
        existing.cpm = existing.impressions > 0 ? (existing.spend / existing.impressions) * 1000 : 0
        existing.cpp = existing.purchases > 0 ? existing.spend / existing.purchases : 0
        existing.aov = existing.purchases > 0 ? existing.revenue / existing.purchases : 0
      }
    }

    // Daily breakdown for charts (with time increment)
    const dailyRaw = await fetchMetaInsights({
      accessToken,
      accountId,
      level: 'account',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
      fields: [
        'spend',
        'actions',
        'action_values',
        'date_start',
        'date_stop',
      ],
    })

    const daily = dailyRaw.map(r => ({
      date: r.date_start || '',
      ...parseInsight(r),
    }))

    return NextResponse.json({
      summary,
      typeBreakdown: typeMap,
      daily,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
