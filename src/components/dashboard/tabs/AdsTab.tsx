'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import SortableTable, { Column } from '@/components/ui/SortableTable'
import { StatusBadge } from '@/components/ui/Badges'
import ConditionalFormatter from '@/components/ui/ConditionalFormatter'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from '@/lib/utils'

interface Ad {
  ad_id: string
  ad_name: string
  adset_name: string
  campaign_name: string
  ad_status: string
  creative_type: string
  thumbnail_url: string | null
  spend: number
  revenue: number
  roas: number
  purchases: number
  impressions: number
  ctr: number
  cpc: number
  cpp: number
}

interface PreviewModal {
  ad: Ad
}

export default function AdsTab() {
  const { accountId, accessToken, brand, datePreset, customStart, customEnd } = useActiveBrand()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [preview, setPreview] = useState<PreviewModal | null>(null)

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
        thumbnails: 'true',
      })
      const res = await fetch(`/api/meta/ads?${params}`)
      const json = await res.json()
      setAds(json.data || [])
    } finally {
      setLoading(false)
    }
  }, [accountId, accessToken, datePreset, customStart, customEnd])

  useEffect(() => { fetchData() }, [fetchData])

  const campaigns = [...new Set(ads.map(a => a.campaign_name))].sort()
  const creativeTypes = [...new Set(ads.map(a => a.creative_type))].sort()

  const filtered = ads.filter(a => {
    if (search && !a.ad_name.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && a.creative_type !== typeFilter) return false
    if (campaignFilter !== 'all' && a.campaign_name !== campaignFilter) return false
    if (statusFilter !== 'all' && a.ad_status.toUpperCase() !== statusFilter.toUpperCase()) return false
    return true
  })

  const columns: Column<Ad>[] = [
    { key: 'thumbnail_url', header: 'Thumb', className: 'w-16',
      render: (v, row) => (
        <button
          onClick={e => { e.stopPropagation(); setPreview({ ad: row }) }}
          className="hover:opacity-80 transition-opacity"
        >
          {v ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v as string} alt="" width={48} height={48} className="rounded-lg object-cover" loading="lazy" />
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'var(--surface-2)' }}>🎨</div>
          )}
        </button>
      )},
    { key: 'ad_name', header: 'Ad Name', sortable: true,
      render: v => <span className="font-medium text-sm truncate max-w-xs block">{v as string}</span> },
    { key: 'creative_type', header: 'Creative Type', sortable: true,
      render: v => <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>{v as string}</span> },
    { key: 'adset_name', header: 'Ad Set', sortable: true,
      render: v => <span className="text-xs truncate max-w-[120px] block" style={{ color: 'var(--text-secondary)' }}>{v as string}</span> },
    { key: 'campaign_name', header: 'Campaign', sortable: true,
      render: v => <span className="text-xs truncate max-w-[120px] block" style={{ color: 'var(--text-secondary)' }}>{v as string}</span> },
    { key: 'ad_status', header: 'Status', render: v => <StatusBadge status={v as string} /> },
    { key: 'spend', header: 'Spend', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'roas', header: 'ROAS', sortable: true, align: 'right',
      render: v => <ConditionalFormatter metric="roas" value={v as number} accountId={accountId} format={x => `${x.toFixed(2)}x`} /> },
    { key: 'purchases', header: 'Purchases', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'ctr', header: 'CTR', sortable: true, align: 'right', render: v => formatPercent(v as number) },
    { key: 'cpc', header: 'CPC', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'cpp', header: 'CPP', sortable: true, align: 'right',
      render: v => <ConditionalFormatter metric="cpp" value={v as number} accountId={accountId} format={x => `₹${x.toFixed(0)}`} /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[200px]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search ads..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1" style={{ color: 'var(--text-primary)' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all">All Creative Types</option>
          {creativeTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all">All Campaigns</option>
          {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{filtered.length} ads</span>
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        loading={loading}
        keyField="ad_id"
        defaultSort={{ key: 'spend', dir: 'desc' }}
        emptyMessage="No ads found"
      />

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setPreview(null)}>
          <div
            className="rounded-2xl border p-6 max-w-lg w-full space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{preview.ad.ad_name}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{preview.ad.campaign_name}</p>
              </div>
              <button onClick={() => setPreview(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            {preview.ad.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.ad.thumbnail_url} alt="" className="w-full rounded-xl object-cover max-h-64" />
            )}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Spend', value: formatCurrency(preview.ad.spend) },
                { label: 'Revenue', value: formatCurrency(preview.ad.revenue) },
                { label: 'ROAS', value: `${preview.ad.roas.toFixed(2)}x` },
                { label: 'Purchases', value: formatNumber(preview.ad.purchases) },
                { label: 'CTR', value: formatPercent(preview.ad.ctr) },
                { label: 'CPC', value: formatCurrency(preview.ad.cpc) },
              ].map(m => (
                <div key={m.label} className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                  <p className="font-semibold text-sm mt-1">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
