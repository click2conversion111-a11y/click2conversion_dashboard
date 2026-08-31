const META_GRAPH_URL = 'https://graph.facebook.com/v18.0'

export interface MetaInsight {
  campaign_id?: string
  campaign_name?: string
  adset_id?: string
  adset_name?: string
  ad_id?: string
  ad_name?: string
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  frequency?: string
  actions?: { action_type: string; value: string }[]
  action_values?: { action_type: string; value: string }[]
  cost_per_action_type?: { action_type: string; value: string }[]
  date_start?: string
  date_stop?: string
  video_3_sec_watched_actions?: { action_type: string; value: string }[]
}

function getActionValue(
  actions: { action_type: string; value: string }[] | undefined,
  type: string
): number {
  if (!actions) return 0
  const found = actions.find((a) => a.action_type === type)
  return found ? parseFloat(found.value) : 0
}

export function parseInsight(raw: MetaInsight) {
  const spend = parseFloat(raw.spend || '0')
  const impressions = parseFloat(raw.impressions || '0')
  const clicks = parseFloat(raw.clicks || '0')
  const purchases = getActionValue(raw.actions, 'purchase')
  const revenue = getActionValue(raw.action_values, 'purchase')
  const roas = spend > 0 ? revenue / spend : 0
  const ctr = parseFloat(raw.ctr || '0')
  const cpc = parseFloat(raw.cpc || '0')
  const cpm = parseFloat(raw.cpm || '0')
  const frequency = parseFloat(raw.frequency || '0')
  const cpp = purchases > 0 ? spend / purchases : 0
  const aov = purchases > 0 ? revenue / purchases : 0

  return {
    spend,
    impressions,
    clicks,
    purchases,
    revenue,
    roas,
    ctr,
    cpc,
    cpm,
    frequency,
    cpp,
    aov,
  }
}

export async function fetchMetaInsights(params: {
  accessToken: string
  accountId: string
  level: 'account' | 'campaign' | 'adset' | 'ad'
  datePreset?: string
  startDate?: string
  endDate?: string
  breakdowns?: string[]
  fields?: string[]
  limit?: number
}) {
  const accountIds = params.accountId.split(',').filter(Boolean)
  
  const fetchSingle = async (accId: string) => {
    const {
      accessToken,
      level,
      datePreset,
      startDate,
      endDate,
      breakdowns,
      fields,
      limit = 500,
    } = params

    const defaultFields = [
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
    ]

    const url = new URL(`${META_GRAPH_URL}/act_${accId}/insights`)
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('level', level)
    url.searchParams.set('fields', (fields || defaultFields).join(','))
    url.searchParams.set('limit', String(limit))

    if (datePreset && datePreset !== 'custom') {
      url.searchParams.set('date_preset', datePreset)
    } else if (startDate && endDate) {
      url.searchParams.set('time_range', JSON.stringify({ since: startDate, until: endDate }))
    }

    if (breakdowns && breakdowns.length > 0) {
      url.searchParams.set('breakdowns', breakdowns.join(','))
    }

    const res = await fetch(url.toString())
    const json = await res.json()

    if (json.error) throw new Error(json.error.message)

    let data = json.data || []

    // Handle pagination
    let next = json.paging?.next
    while (next && data.length < 1000) {
      const pageRes = await fetch(next)
      const pageJson = await pageRes.json()
      data = [...data, ...(pageJson.data || [])]
      next = pageJson.paging?.next
    }
    return data as MetaInsight[]
  }

  // Fetch all accounts in parallel
  const results = await Promise.all(accountIds.map(id => fetchSingle(id)))
  return results.flat()
}

export async function fetchAdThumbnails(
  adIds: string[],
  accessToken: string
): Promise<Record<string, string>> {
  const thumbnails: Record<string, string> = {}
  const chunks = []
  for (let i = 0; i < adIds.length; i += 50) {
    chunks.push(adIds.slice(i, i + 50))
  }

  for (const chunk of chunks) {
    const params = new URLSearchParams({
      ids: chunk.join(','),
      fields: 'creative{thumbnail_url}',
      access_token: accessToken,
    })
    const res = await fetch(`${META_GRAPH_URL}?${params}`)
    const json = await res.json()
    for (const [id, val] of Object.entries(json as Record<string, { creative?: { thumbnail_url?: string } }>)) {
      if (val?.creative?.thumbnail_url) {
        thumbnails[id] = val.creative.thumbnail_url
      }
    }
  }
  return thumbnails
}

export async function fetchMetaAdAccounts(accessToken: string) {
  const url = new URL(`${META_GRAPH_URL}/me/adaccounts`)
  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('fields', 'id,name,account_id,currency,account_status')
  url.searchParams.set('limit', '100')

  const res = await fetch(url.toString())
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.data || []
}
