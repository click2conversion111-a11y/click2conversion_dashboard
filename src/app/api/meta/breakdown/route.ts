import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaInsights, parseInsight } from '@/lib/meta'

const BREAKDOWN_MAP: Record<string, string[]> = {
  age: ['age'],
  gender: ['gender'],
  device: ['device_platform'],
  region: ['region'],
  placement: ['publisher_platform', 'impression_device'],
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId')
  const accessToken = searchParams.get('accessToken')
  const breakdownType = searchParams.get('breakdownType') || 'age'
  const datePreset = searchParams.get('datePreset') || 'today'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  if (!accountId || !accessToken) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  const breakdowns = BREAKDOWN_MAP[breakdownType] || ['age']

  try {
    const raw = await fetchMetaInsights({
      accessToken,
      accountId,
      level: 'account',
      datePreset: datePreset !== 'custom' ? datePreset : undefined,
      startDate,
      endDate,
      breakdowns,
      fields: [
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

    const data = raw.map(r => {
      const segment = breakdowns.map(b => (r as Record<string, unknown>)[b] as string || '').join(' / ')
      return {
        segment,
        ...parseInsight(r),
      }
    })

    return NextResponse.json({ data, fetchedAt: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
