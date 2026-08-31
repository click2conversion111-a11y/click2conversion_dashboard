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
    const raw = await fetchMetaInsights({
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
        'cost_per_action_type',
      ],
    })

    const campaigns = raw.map(r => ({
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name || '',
      campaign_status: 'ACTIVE', // Insights only return objects with data
      type: detectCampaignType(r.campaign_name || ''),
      ...parseInsight(r),
    }))

    return NextResponse.json({ data: campaigns, fetchedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
