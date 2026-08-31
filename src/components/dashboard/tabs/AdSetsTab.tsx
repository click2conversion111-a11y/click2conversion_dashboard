'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Download } from 'lucide-react'
import SortableTable, { Column } from '@/components/ui/SortableTable'
import { CampaignTypeBadge, StatusBadge } from '@/components/ui/Badges'
import ConditionalFormatter from '@/components/ui/ConditionalFormatter'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from '@/lib/utils'

interface AdSet {
  adset_id: string
  adset_name: string
  campaign_id: string
  campaign_name: string
  adset_status: string
  type: string
  spend: number
  revenue: number
  roas: number
  purchases: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  frequency: number
  cpp: number
}

interface Ad {
  ad_id: string
  ad_name: string
  ad_status: string
  creative_type: string
  spend: number
  revenue: number
  roas: number
  purchases: number
  ctr: number
  cpc: number
  cpp: number
  thumbnail_url: string | null
}

function AdExpand({ adset, accountId, accessToken, datePreset, customStart, customEnd }: {
  adset: AdSet
  accountId: string
  accessToken: string
  datePreset: string
  customStart: string | null
  customEnd: string | null
}) {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    const { start, end } = getDateRange(datePreset as Parameters<typeof getDateRange>[0])
    const params = new URLSearchParams({
      accountId,
      accessToken,
      adsetId: adset.adset_id,
      datePreset,
      startDate: customStart || start,
      endDate: customEnd || end,
      thumbnails: 'true',
    })
    fetch(`/api/meta/ads?${params}`)
      .then(r => r.json())
      .then(j => setAds(j.data || []))
      .finally(() => setLoading(false))
  }, [adset.adset_id, accountId, accessToken, datePreset, customStart, customEnd])

  const cols: Column<Ad>[] = [
    { key: 'ad_name', header: 'Ad Name', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {row.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.thumbnail_url} alt="" width={32} height={32} className="rounded object-cover" loading="lazy" />
          )}
          <span className="text-sm truncate max-w-xs">{v as string}</span>
        </div>
      ) },
    { key: 'creative_type', header: 'Type', render: v => <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>{v as string}</span> },
    { key: 'ad_status', header: 'Status', render: v => <StatusBadge status={v as string} /> },
    { key: 'spend', header: 'Spend', align: 'right', render: v => formatCurrency(v as number) },
    { key: 'roas', header: 'ROAS', align: 'right',
      render: v => <ConditionalFormatter metric="roas" value={v as number} accountId={accountId} format={x => `${x.toFixed(2)}x`} /> },
    { key: 'purchases', header: 'Purchases', align: 'right', render: v => formatNumber(v as number) },
    { key: 'ctr', header: 'CTR', align: 'right', render: v => formatPercent(v as number) },
  ]

  return (
    <div className="px-8 py-3">
      <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
        Ads — {adset.adset_name}
      </p>
      <SortableTable columns={cols} data={ads} loading={loading} keyField="ad_id" pageSize={20} emptyMessage="No ads found" />
    </div>
  )
}

export default function AdSetsTab() {
  const { accountId, accessToken, brand, datePreset, customStart, customEnd } = useActiveBrand()
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    if (!accountId || !accessToken) return
    setLoading(true)
    try {
      const { start, end } = getDateRange(datePreset)
      const params = new URLSearchParams({
        accountId: accountId,
        accessToken: accessToken,
        datePreset,
        startDate: customStart || start,
        endDate: customEnd || end,
      })
      const res = await fetch(`/api/meta/adsets?${params}`)
      const json = await res.json()
      setAdsets(json.data || [])
    } finally {
      setLoading(false)
    }
  }, [accountId, accessToken, datePreset, customStart, customEnd])

  useEffect(() => { fetchData() }, [fetchData])

  const campaigns = [...new Set(adsets.map(a => a.campaign_name))].sort()

  const filtered = adsets.filter(a => {
    if (search && !a.adset_name.toLowerCase().includes(search.toLowerCase())) return false
    if (campaignFilter !== 'all' && a.campaign_name !== campaignFilter) return false
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (statusFilter !== 'all' && a.adset_status.toUpperCase() !== statusFilter.toUpperCase()) return false
    return true
  })

  const exportCSV = () => {
    const headers = ['Ad Set', 'Campaign', 'Type', 'Status', 'Spend', 'Revenue', 'ROAS', 'Purchases', 'CTR', 'CPC', 'CPM', 'CPP']
    const rows = filtered.map(a => [
      `"${a.adset_name}"`, `"${a.campaign_name}"`, a.type, a.adset_status,
      a.spend.toFixed(2), a.revenue.toFixed(2), a.roas.toFixed(2),
      a.purchases, a.ctr.toFixed(2), a.cpc.toFixed(2), a.cpm.toFixed(2), a.cpp.toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'adsets.csv'
    a.click()
  }

  const columns: Column<AdSet>[] = [
    { key: 'adset_name', header: 'Ad Set Name', sortable: true,
      render: v => <span className="font-medium text-sm">{v as string}</span> },
    { key: 'campaign_name', header: 'Campaign', sortable: true,
      render: v => <span className="text-sm truncate max-w-[160px] block" style={{ color: 'var(--text-secondary)' }}>{v as string}</span> },
    { key: 'type', header: 'Type', sortable: true, render: v => <CampaignTypeBadge type={v as string} /> },
    { key: 'adset_status', header: 'Status', sortable: true, render: v => <StatusBadge status={v as string} /> },
    { key: 'spend', header: 'Spend', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'roas', header: 'ROAS', sortable: true, align: 'right',
      render: v => <ConditionalFormatter metric="roas" value={v as number} accountId={accountId} format={x => `${x.toFixed(2)}x`} /> },
    { key: 'purchases', header: 'Purchases', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'ctr', header: 'CTR', sortable: true, align: 'right', render: v => formatPercent(v as number) },
    { key: 'cpc', header: 'CPC', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'cpm', header: 'CPM', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'frequency', header: 'Freq', sortable: true, align: 'right', render: v => (v as number).toFixed(2) },
    { key: 'cpp', header: 'CPP', sortable: true, align: 'right',
      render: v => <ConditionalFormatter metric="cpp" value={v as number} accountId={accountId} format={x => `₹${x.toFixed(0)}`} /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[200px]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search ad sets..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1" style={{ color: 'var(--text-primary)' }} />
        </div>
        <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all">All Campaigns</option>
          {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all">All Types</option>
          {['TOF', 'MOF', 'BOF', 'ADV+', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Download size={14} /> Export CSV
        </button>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{filtered.length} ad sets</span>
      </div>
      <SortableTable
        columns={columns}
        data={filtered}
        loading={loading}
        keyField="adset_id"
        defaultSort={{ key: 'spend', dir: 'desc' }}
        expandedRowRender={row => (
          <AdExpand adset={row} accountId={accountId} accessToken={accessToken}
            datePreset={datePreset} customStart={customStart} customEnd={customEnd} />
        )}
        emptyMessage="No ad sets found"
      />
    </div>
  )
}
