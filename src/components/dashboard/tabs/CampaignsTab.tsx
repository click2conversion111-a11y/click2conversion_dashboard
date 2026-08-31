'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Download } from 'lucide-react'
import SortableTable, { Column } from '@/components/ui/SortableTable'
import { CampaignTypeBadge, StatusBadge } from '@/components/ui/Badges'
import ConditionalFormatter from '@/components/ui/ConditionalFormatter'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from '@/lib/utils'

interface Campaign {
  campaign_id: string
  campaign_name: string
  campaign_status: string
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

interface AdSet {
  adset_id: string
  adset_name: string
  campaign_id: string
  spend: number
  revenue: number
  roas: number
  purchases: number
  ctr: number
  cpc: number
  cpp: number
}

function AdSetExpand({ campaign, accountId, accessToken, datePreset, customStart, customEnd }: {
  campaign: Campaign
  accountId: string
  accessToken: string
  datePreset: string
  customStart: string | null
  customEnd: string | null
}) {
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    const { start, end } = getDateRange(datePreset as Parameters<typeof getDateRange>[0])
    const params = new URLSearchParams({
      accountId,
      accessToken,
      campaignId: campaign.campaign_id,
      datePreset,
      startDate: customStart || start,
      endDate: customEnd || end,
    })
    fetch(`/api/meta/adsets?${params}`)
      .then(r => r.json())
      .then(j => setAdsets(j.data || []))
      .finally(() => setLoading(false))
  }, [campaign.campaign_id, accountId, accessToken, datePreset, customStart, customEnd])

  const cols: Column<AdSet>[] = [
    { key: 'adset_name', header: 'Ad Set Name', sortable: true },
    { key: 'spend', header: 'Spend', sortable: true, align: 'right',
      render: v => formatCurrency(v as number) },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right',
      render: v => formatCurrency(v as number) },
    { key: 'roas', header: 'ROAS', sortable: true, align: 'right',
      render: (v) => <ConditionalFormatter metric="roas" value={v as number} accountId={accountId} format={x => `${x.toFixed(2)}x`} /> },
    { key: 'purchases', header: 'Purchases', sortable: true, align: 'right',
      render: v => formatNumber(v as number) },
    { key: 'ctr', header: 'CTR', sortable: true, align: 'right',
      render: v => formatPercent(v as number) },
    { key: 'cpc', header: 'CPC', sortable: true, align: 'right',
      render: v => formatCurrency(v as number) },
    { key: 'cpp', header: 'CPP', sortable: true, align: 'right',
      render: (v) => <ConditionalFormatter metric="cpp" value={v as number} accountId={accountId} format={x => `₹${x.toFixed(0)}`} /> },
  ]

  return (
    <div className="px-8 py-3">
      <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
        Ad Sets — {campaign.campaign_name}
      </p>
      <SortableTable
        columns={cols}
        data={adsets}
        loading={loading}
        keyField="adset_id"
        pageSize={20}
        emptyMessage="No ad sets found"
      />
    </div>
  )
}

export default function CampaignsTab() {
  const { accountId, accessToken, brand, datePreset, customStart, customEnd } = useActiveBrand()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    if (!accountId || !accessToken) return
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange(datePreset)
      const params = new URLSearchParams({
        accountId: accountId,
        accessToken: accessToken,
        datePreset,
        startDate: customStart || start,
        endDate: customEnd || end,
      })
      const res = await fetch(`/api/meta/campaigns?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setCampaigns(json.data || [])
      setLastUpdated(new Date())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [accountId, accessToken, datePreset, customStart, customEnd])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = campaigns.filter(c => {
    if (search && !c.campaign_name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && c.campaign_status.toUpperCase() !== statusFilter.toUpperCase()) return false
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    return true
  })

  const exportCSV = () => {
    const headers = ['Campaign Name', 'Type', 'Status', 'Spend', 'Revenue', 'ROAS', 'Purchases', 'Impressions', 'Clicks', 'CTR', 'CPC', 'CPM', 'Frequency', 'CPP']
    const rows = filtered.map(c => [
      `"${c.campaign_name}"`, c.type, c.campaign_status,
      c.spend.toFixed(2), c.revenue.toFixed(2), c.roas.toFixed(2),
      c.purchases, c.impressions, c.clicks,
      c.ctr.toFixed(2), c.cpc.toFixed(2), c.cpm.toFixed(2),
      c.frequency.toFixed(2), c.cpp.toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand?.name || 'account'}_campaigns.csv`
    a.click()
  }

  const columns: Column<Campaign>[] = [
    { key: 'campaign_name', header: 'Campaign Name', sortable: true,
      render: (v) => <span className="font-medium text-sm max-w-xs truncate block" style={{ color: 'var(--text-primary)' }}>{v as string}</span> },
    { key: 'type', header: 'Type', sortable: true,
      render: (v) => <CampaignTypeBadge type={v as string} /> },
    { key: 'campaign_status', header: 'Status', sortable: true,
      render: (v) => <StatusBadge status={v as string} /> },
    { key: 'spend', header: 'Spend', sortable: true, align: 'right',
      render: v => <span className="text-sm font-medium">{formatCurrency(v as number)}</span> },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right',
      render: v => <span className="text-sm">{formatCurrency(v as number)}</span> },
    { key: 'roas', header: 'ROAS', sortable: true, align: 'right',
      render: (v) => <ConditionalFormatter metric="roas" value={v as number} accountId={accountId} format={x => `${x.toFixed(2)}x`} /> },
    { key: 'purchases', header: 'Purchases', sortable: true, align: 'right',
      render: v => <span className="text-sm">{formatNumber(v as number)}</span> },
    { key: 'impressions', header: 'Impr.', sortable: true, align: 'right',
      render: v => <span className="text-sm">{formatNumber(v as number)}</span> },
    { key: 'ctr', header: 'CTR', sortable: true, align: 'right',
      render: v => <span className="text-sm">{formatPercent(v as number)}</span> },
    { key: 'cpc', header: 'CPC', sortable: true, align: 'right',
      render: v => <span className="text-sm">{formatCurrency(v as number)}</span> },
    { key: 'cpm', header: 'CPM', sortable: true, align: 'right',
      render: v => <span className="text-sm">{formatCurrency(v as number)}</span> },
    { key: 'frequency', header: 'Freq', sortable: true, align: 'right',
      render: v => <span className="text-sm">{(v as number).toFixed(2)}</span> },
    { key: 'cpp', header: 'CPP', sortable: true, align: 'right',
      render: (v) => <ConditionalFormatter metric="cpp" value={v as number} accountId={accountId} format={x => `₹${x.toFixed(0)}`} /> },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#FF4D4D20', color: '#FF4D4D' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[200px]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Types</option>
          {['TOF', 'MOF', 'BOF', 'ADV+', 'Other'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Download size={14} />
          Export CSV
        </button>

        {lastUpdated && (
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} campaigns · Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        loading={loading}
        keyField="campaign_id"
        defaultSort={{ key: 'spend', dir: 'desc' }}
        expandedRowRender={(row) => (
          <AdSetExpand
            campaign={row}
            accountId={accountId}
            accessToken={accessToken}
            datePreset={datePreset}
            customStart={customStart}
            customEnd={customEnd}
          />
        )}
        emptyMessage="No campaigns found"
      />
    </div>
  )
}
