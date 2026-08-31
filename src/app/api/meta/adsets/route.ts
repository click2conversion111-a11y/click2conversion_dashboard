import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaInsights, parseInsight } from '@/lib/meta'
import { detectCampaignType } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId')
  const accessToken = searchParams.get('accessToken')
  const campaignId = searchParams.get('campaignId') || undefined
  const datePreset = searchParams.get('datePreset') || 'today'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  if (!accountId || !accessToken) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  try {
    const raw = await fetchMetaInsights({
      accessToken,
      accountId,
      level: 'adset',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
      fields: [
        'campaign_id',
        'campaign_name',
        'adset_id',
        'adset_name',
        'spend',
        'impressions',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'frequency',
        'actions',
        'action_values',
      ],
    })

    const filtered = campaignId
      ? raw.filter(r => r.campaign_id === campaignId)
      : raw

    const adsets = filtered.map(r => ({
      adset_id: r.adset_id,
      adset_name: r.adset_name || '',
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name || '',
      adset_status: 'ACTIVE',
      type: detectCampaignType(r.campaign_name || ''),
      ...parseInsight(r),
    }))

    return NextResponse.json({ data: adsets, fetchedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
