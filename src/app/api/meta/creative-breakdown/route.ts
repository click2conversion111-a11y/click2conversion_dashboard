import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaInsights, parseInsight, fetchAdThumbnails } from '@/lib/meta'
import {
  detectCreativeType,
  detectReelSubType,
  detectStaticSubType,
  detectCarouselSubType,
} from '@/lib/utils'

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
      level: 'ad',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
      fields: [
        'ad_id',
        'ad_name',
        'adset_name',
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

    // Fetch thumbnails
    const ids = raw.map(r => r.ad_id!).filter(Boolean)
    let thumbnails: Record<string, string> = {}
    if (ids.length > 0) {
      thumbnails = await fetchAdThumbnails(ids, accessToken)
    }

    type AdEntry = {
      ad_id: string
      ad_name: string
      adset_name: string
      campaign_name: string
      ad_status: string
      creative_type: string
      sub_type: string
      thumbnail_url: string | null
      spend: number
      impressions: number
      clicks: number
      ctr: number
      cpc: number
      cpm: number
      purchases: number
      revenue: number
      roas: number
      cpp: number
      hook_rate?: number
    }

    const grouped: Record<string, {
      ads: AdEntry[]
      spend: number
      revenue: number
      roas: number
      purchases: number
      ctr: number
      cpc: number
      cpm: number
      cpp: number
      impressions: number
    }> = {
      Catalog: { ads: [], spend: 0, revenue: 0, roas: 0, purchases: 0, ctr: 0, cpc: 0, cpm: 0, cpp: 0, impressions: 0 },
      Reel: { ads: [], spend: 0, revenue: 0, roas: 0, purchases: 0, ctr: 0, cpc: 0, cpm: 0, cpp: 0, impressions: 0 },
      Static: { ads: [], spend: 0, revenue: 0, roas: 0, purchases: 0, ctr: 0, cpc: 0, cpm: 0, cpp: 0, impressions: 0 },
      Carousel: { ads: [], spend: 0, revenue: 0, roas: 0, purchases: 0, ctr: 0, cpc: 0, cpm: 0, cpp: 0, impressions: 0 },
      Other: { ads: [], spend: 0, revenue: 0, roas: 0, purchases: 0, ctr: 0, cpc: 0, cpm: 0, cpp: 0, impressions: 0 },
    }

    for (const r of raw) {
      const type = detectCreativeType(r.ad_name || '')
      const parsed = parseInsight(r)

      let subType = 'Other'
      if (type === 'Reel') subType = detectReelSubType(r.ad_name || '')
      else if (type === 'Static') subType = detectStaticSubType(r.ad_name || '')
      else if (type === 'Carousel') subType = detectCarouselSubType(r.ad_name || '')

      const entry: AdEntry = {
        ad_id: r.ad_id || '',
        ad_name: r.ad_name || '',
        adset_name: r.adset_name || '',
        campaign_name: r.campaign_name || '',
        ad_status: 'ACTIVE',
        creative_type: type,
        sub_type: subType,
        thumbnail_url: thumbnails[r.ad_id!] || null,
        ...parsed,
      }


      const bucket = grouped[type] || grouped.Other
      bucket.ads.push(entry)
      bucket.spend += parsed.spend
      bucket.revenue += parsed.revenue
      bucket.purchases += parsed.purchases
      bucket.impressions += parsed.impressions
    }

    // Recalculate aggregated metrics
    for (const g of Object.values(grouped)) {
      g.roas = g.spend > 0 ? g.revenue / g.spend : 0
      g.ctr = g.impressions > 0 ? (g.ads.reduce((s, a) => s + a.clicks, 0) / g.impressions) * 100 : 0
      g.cpc = g.ads.reduce((s, a) => s + a.clicks, 0) > 0
        ? g.spend / g.ads.reduce((s, a) => s + a.clicks, 0) : 0
      g.cpm = g.impressions > 0 ? (g.spend / g.impressions) * 1000 : 0
      g.cpp = g.purchases > 0 ? g.spend / g.purchases : 0
    }

    return NextResponse.json({ data: grouped, fetchedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
