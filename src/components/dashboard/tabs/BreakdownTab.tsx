'use client'
import { useEffect, useState, useCallback } from 'react'
import { Download, Info, BarChart3, PieChart, Map, Layout as LayoutIcon, Users } from 'lucide-react'
import SortableTable, { Column } from '@/components/ui/SortableTable'
import ConditionalFormatter from '@/components/ui/ConditionalFormatter'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from '@/lib/utils'

type BreakdownType = 'age' | 'gender' | 'device' | 'region' | 'placement'

interface BreakdownRow {
  segment: string
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
}

const BREAKDOWN_OPTIONS: { value: BreakdownType; label: string; icon: any }[] = [
  { value: 'age', label: 'Age', icon: <Users size={14} /> },
  { value: 'gender', label: 'Gender', icon: <Users size={14} /> },
  { value: 'device', label: 'Device', icon: <LayoutIcon size={14} /> },
  { value: 'region', label: 'Region', icon: <Map size={14} /> },
  { value: 'placement', label: 'Placement', icon: <BarChart3 size={14} /> },
]

export default function BreakdownTab() {
  const { accountId, accessToken, brand, datePreset, customStart, customEnd } = useActiveBrand()
  const [breakdownType, setBreakdownType] = useState<BreakdownType>('age')
  const [data, setData] = useState<BreakdownRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (!accountId || !accessToken) return
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange(datePreset)
      const params = new URLSearchParams({
        accountId,
        accessToken,
        datePreset,
        breakdownType,
        startDate: customStart || start,
        endDate: customEnd || end,
      })
      const res = await fetch(`/api/meta/breakdown?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.data || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [accountId, accessToken, datePreset, customStart, customEnd, breakdownType])

  useEffect(() => { fetchData() }, [fetchData])

  const totalSpend = data.reduce((s, r) => s + r.spend, 0)
  const maxSpend = Math.max(...data.map(r => r.spend), 1)

  const exportCSV = () => {
    const headers = ['Segment', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'CPM', 'Purchases', 'Revenue', 'ROAS']
    const rows = data.map(r => [
      `"${r.segment}"`, r.spend.toFixed(2), r.impressions, r.clicks,
      r.ctr.toFixed(2), r.cpc.toFixed(2), r.cpm.toFixed(2),
      r.purchases, r.revenue.toFixed(2), r.roas.toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `breakdown_${breakdownType}.csv`
    a.click()
  }

  const columns: Column<BreakdownRow>[] = [
    { 
      key: 'segment', 
      header: breakdownType.charAt(0).toUpperCase() + breakdownType.slice(1), 
      sortable: true,
      render: (v, row) => (
        <div className="space-y-1 py-1">
          <span className="font-semibold text-sm">{v as string}</span>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-[120px]">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${(row.spend / maxSpend) * 100}%`,
                background: 'var(--accent-blue)'
              }} 
            />
          </div>
        </div>
      )
    },
    { key: 'spend', header: 'Spend', sortable: true, align: 'right', 
      render: v => (
        <div className="text-right">
          <p className="font-medium">{formatCurrency(v as number)}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {((v as number) / totalSpend * 100).toFixed(1)}% of total
          </p>
        </div>
      )
    },
    { key: 'impressions', header: 'Impr.', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'clicks', header: 'Clicks', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'ctr', header: 'CTR', sortable: true, align: 'right', render: v => formatPercent(v as number) },
    { key: 'purchases', header: 'Purchases', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { 
      key: 'roas', 
      header: 'ROAS', 
      sortable: true, 
      align: 'right',
      render: v => <ConditionalFormatter metric="roas" value={v as number} accountId={accountId} format={x => `${x.toFixed(2)}x`} /> 
    },
    { 
      key: 'cpp', 
      header: 'CPP', 
      sortable: true, 
      align: 'right',
      render: v => <ConditionalFormatter metric="cpp" value={v as number} accountId={accountId} format={x => `₹${x.toFixed(0)}`} /> 
    },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm flex items-center gap-2" style={{ background: '#FF4D4D20', color: '#FF4D4D' }}>
          <Info size={14} />
          {error}
        </div>
      )}

      {/* Segment Selector & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-1 rounded-xl border bg-black/10" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1 flex-wrap">
          {BREAKDOWN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setBreakdownType(opt.value)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                background: breakdownType === opt.value ? 'var(--accent-blue)' : 'transparent',
                color: breakdownType === opt.value ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 px-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Summary Row */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Top Segment (Spend)</p>
            <div className="flex items-end justify-between">
              <h3 className="text-lg font-bold">{data.sort((a,b)=>b.spend-a.spend)[0].segment}</h3>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent-blue)' }}>{((data[0].spend / totalSpend) * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Best Performing (ROAS)</p>
            <div className="flex items-end justify-between">
              <h3 className="text-lg font-bold">{data.sort((a,b)=>b.roas-a.roas).find(x => x.spend > (totalSpend * 0.05))?.segment || data[0].segment}</h3>
              <div className="text-right">
                <ConditionalFormatter metric="roas" value={data.sort((a,b)=>b.roas-a.roas)[0].roas} format={x => `${x.toFixed(2)}x`} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Audience Reach</p>
            <div className="flex items-end justify-between">
              <h3 className="text-lg font-bold">{formatNumber(data.reduce((s,r)=>s+r.impressions, 0))}</h3>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Impressions</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <SortableTable
          columns={columns}
          data={data}
          loading={loading}
          keyField="segment"
          defaultSort={{ key: 'spend', dir: 'desc' }}
          emptyMessage="No breakdown data found for this selection"
        />
      </div>
    </div>
  )
}
