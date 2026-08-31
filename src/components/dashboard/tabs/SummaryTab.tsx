'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  DollarSign, TrendingUp, ShoppingCart, Target,
  MousePointer, Zap, BarChart2, Activity, AlertCircle
} from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import { CampaignTypeBadge } from '@/components/ui/Badges'
import ConditionalFormatter from '@/components/ui/ConditionalFormatter'
import { useDashboardStore } from '@/lib/store'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from '@/lib/utils'

interface SummaryData {
  summary: {
    spend: number; revenue: number; roas: number; purchases: number
    aov: number; ctr: number; cpc: number; cpm: number
    impressions: number; clicks: number
  }
  typeBreakdown: Record<string, {
    spend: number; revenue: number; roas: number; purchases: number
    ctr: number; cpc: number; cpm: number; cpp: number; aov: number; count: number
  }>
  daily: { date: string; spend: number; revenue: number; purchases: number }[]
  fetchedAt: string
}

interface ShopifySummary {
  revenue: { gross: number; confirmed: number }
  counts: { total: number }
}

const TYPE_ORDER = ['TOF', 'MOF', 'BOF', 'ADV+', 'Other']

export default function SummaryTab() {
  const { setSettingsOpen } = useDashboardStore()
  const { 
    accountId, accessToken, brand, datePreset, customStart, customEnd, 
    hasShopifyConnection, shopUrl, shopAccessToken, metaCurrency 
  } = useActiveBrand()
  const [data, setData] = useState<SummaryData | null>(null)
  const [shopifyData, setShopifyData] = useState<ShopifySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    if (!accountId && !hasShopifyConnection) return
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange(datePreset)
      const dateParams = {
        datePreset,
        ...(datePreset === 'custom' && customStart && customEnd
          ? { startDate: customStart, endDate: customEnd }
          : { startDate: start, endDate: end }),
      }

      // Meta Data
      if (accountId && accessToken) {
        const metaParams = new URLSearchParams({ accountId, accessToken, ...dateParams })
        const metaRes = await fetch(`/api/meta/summary?${metaParams}`)
        const metaJson = await metaRes.json()
        if (metaJson.error) throw new Error(metaJson.error)
        setData(metaJson)
      }

      // Shopify Data (Optional)
      if (hasShopifyConnection && shopUrl && shopAccessToken) {
        const shopifyParams = new URLSearchParams({ 
          accountId: brand?.meta?.accountId || brand?.id || '', 
          shopUrl,
          accessToken: shopAccessToken,
          ...dateParams 
        })
        const shopRes = await fetch(`/api/shopify/orders?${shopifyParams}`)
        const shopJson = await shopRes.json()
        if (!shopJson.error) setShopifyData(shopJson)
      }

      setLastUpdated(new Date())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [accountId, accessToken, datePreset, customStart, customEnd, hasShopifyConnection, shopUrl, shopAccessToken, brand])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!accountId && !hasShopifyConnection) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>No connections found for this brand</p>
      </div>
    )
  }

  const s = data?.summary
  const totalSpend = data
    ? Object.values(data.typeBreakdown).reduce((sum, t) => sum + t.spend, 0) || 1
    : 1

  // Marketing Efficiency Ratio (Shopify Revenue / Meta Spend)
  const mer = shopifyData && s && s.spend > 0 ? shopifyData.revenue.gross / s.spend : null

  const kpiRow1 = [
    {
      label: 'Meta Spend',
      value: s ? formatCurrency(s.spend, metaCurrency) : '–',
      icon: <DollarSign size={16} />,
      color: '#4D9EFF',
    },
    {
      label: 'Shopify Revenue',
      value: shopifyData ? formatCurrency(shopifyData.revenue.gross, metaCurrency) : (s ? formatCurrency(s.revenue, metaCurrency) : '–'),
      icon: <TrendingUp size={16} />,
      color: '#00C48C',
      tooltip: hasShopifyConnection ? 'Gross sales from Shopify' : 'Attributed revenue from Meta'
    },
    {
      label: hasShopifyConnection ? 'e.ROAS (MER)' : 'ROAS',
      value: hasShopifyConnection && mer ? `${mer.toFixed(2)}x` : (s ? `${s.roas.toFixed(2)}x` : '–'),
      icon: <Target size={16} />,
      color: '#A78BFA',
      tooltip: hasShopifyConnection ? 'Total Revenue / Meta Spend' : 'Meta Attributed ROAS'
    },
    {
      label: 'Orders',
      value: shopifyData ? formatNumber(shopifyData.counts.total) : (s ? formatNumber(s.purchases) : '–'),
      icon: <ShoppingCart size={16} />,
      color: '#FFB800',
    },
  ]

  const kpiRow2 = [
    {
      label: 'AOV',
      value: s ? formatCurrency(s.aov, metaCurrency) : '–',
      icon: <BarChart2 size={16} />,
      color: '#FF4D4D',
    },
    {
      label: 'Link CTR',
      value: s ? formatPercent(s.ctr) : '–',
      icon: <MousePointer size={16} />,
      color: '#4D9EFF',
    },
    {
      label: 'CPC',
      value: s ? formatCurrency(s.cpc, metaCurrency) : '–',
      icon: <Zap size={16} />,
      color: '#FFB800',
    },
    {
      label: 'CPM',
      value: s ? formatCurrency(s.cpm, metaCurrency) : '–',
      icon: <Activity size={16} />,
      color: '#A78BFA',
    },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-5 py-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: '#FF4D4D15', borderColor: '#FF4D4D30', color: '#FF4D4D' }}>
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <div className="space-y-0.5">
              <p className="font-bold text-sm">
                {error.toLowerCase().includes('expired') || error.toLowerCase().includes('session') 
                  ? 'Meta Session Expired' 
                  : 'Connection Error'}
              </p>
              <p className="text-xs opacity-80 max-w-xl line-clamp-1">{error}</p>
            </div>
          </div>
          {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('session')) && (
            <button 
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors shadow-lg active:scale-95 flex-shrink-0"
            >
              Reconnect Meta
            </button>
          )}
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
        ) : (
          kpiRow1.map((k, i) => <MetricCard key={k.label} {...k} delay={i * 50} />)
        )}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
        ) : (
          kpiRow2.map((k, i) => <MetricCard key={k.label} {...k} delay={(i + 4) * 50} />)
        )}
      </div>

      {/* Campaign Type Breakdown */}
      {data && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Meta Campaign Type Breakdown
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {TYPE_ORDER.map((type, idx) => {
              const t = data.typeBreakdown[type]
              if (!t && type === 'Other') return null
              const spendPct = t ? (t.spend / totalSpend) * 100 : 0
              return (
                <div
                  key={type}
                  className="animate-card rounded-xl border p-4 space-y-3"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    animationDelay: `${idx * 60}ms`,
                    opacity: 0,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <CampaignTypeBadge type={type} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t?.count || 0} campaigns
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Spend</span>
                      <span className="text-xs font-medium">{t ? formatCurrency(t.spend, metaCurrency) : '–'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Revenue</span>
                      <span className="text-xs font-medium">{t ? formatCurrency(t.revenue, metaCurrency) : '–'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ROAS</span>
                      {t ? (
                        <ConditionalFormatter
                          metric="roas"
                          value={t.roas}
                          accountId={accountId}
                          format={v => `${v.toFixed(2)}x`}
                          className="text-xs"
                        />
                      ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>}
                    </div>
                  </div>

                  <div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${spendPct}%`, background: '#4D9EFF' }} />
                    </div>
                    <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                      {spendPct.toFixed(1)}% of Meta spend
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4">Meta Spend vs Attributed Revenue</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.daily || []}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4D9EFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4D9EFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C48C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C48C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d ? d.slice(5) : ''} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => formatCurrency(v, metaCurrency)} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }} labelStyle={{ color: 'var(--text-secondary)' }} formatter={(v, name) => [formatCurrency(Number(v) || 0, metaCurrency), String(name)]} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="spend" stroke="#4D9EFF" fill="url(#spendGrad)" name="Spend" strokeWidth={2} />
                <Area type="monotone" dataKey="revenue" stroke="#00C48C" fill="url(#revGrad)" name="Revenue" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4">Meta Purchases Breakdown</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d ? d.slice(5) : ''} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }} labelStyle={{ color: 'var(--text-secondary)' }} />
                <Bar dataKey="purchases" fill="#FFB800" name="Purchases" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
