import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaInsights, parseInsight, fetchAdThumbnails } from '@/lib/meta'
import { detectCreativeType } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId')
  const accessToken = searchParams.get('accessToken')
  const adsetId = searchParams.get('adsetId') || undefined
  const datePreset = searchParams.get('datePreset') || 'today'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const withThumbnails = searchParams.get('thumbnails') === 'true'

  if (!accountId || !accessToken) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  try {
    const raw = await fetchMetaInsights({
      accessToken,
      accountId,
      level: 'ad',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
      fields: [
        'ad_id',
        'ad_name',
        'adset_id',
        'adset_name',
        'campaign_id',
        'campaign_name',
        'spend',
        'impressions',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'actions',
        'action_values',
      ],
    })

    const filtered = adsetId ? raw.filter(r => r.adset_id === adsetId) : raw

    let thumbnails: Record<string, string> = {}
    if (withThumbnails && filtered.length > 0) {
      const ids = filtered.map(r => r.ad_id!).filter(Boolean)
      thumbnails = await fetchAdThumbnails(ids, accessToken)
    }

    const ads = filtered.map(r => ({
      ad_id: r.ad_id,
      ad_name: r.ad_name || '',
      adset_id: r.adset_id,
      adset_name: r.adset_name || '',
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name || '',
      ad_status: 'ACTIVE',
      creative_type: detectCreativeType(r.ad_name || ''),
      thumbnail_url: thumbnails[r.ad_id!] || null,
      ...parseInsight(r),
    }))

    return NextResponse.json({ data: ads, fetchedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
