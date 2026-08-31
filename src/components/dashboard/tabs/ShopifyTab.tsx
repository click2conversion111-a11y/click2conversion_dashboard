'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingCart, DollarSign, Package, AlertCircle,
  TrendingDown, TrendingUp, Download
} from 'lucide-react'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { getDateRange, formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import MetricCard from '@/components/ui/MetricCard'
import SortableTable, { Column } from '@/components/ui/SortableTable'

interface ShopifyData {
  counts: {
    total: number
    Delivered?: number
    Cancelled?: number
    Returned?: number
    Processing?: number
    'Pending COD'?: number
    Shipped?: number
  }
  revenue: {
    gross: number
    confirmed: number
    at_risk: number
    lost: number
  }
  products: {
    name: string
    orders: number
    revenue: number
    delivered: number
    cancelled: number
    returned: number
    return_rate: number
    aov: number
  }[]
  orders: {
    id: number
    created_at: string
    total_price: string
    status: string
    line_items: number
  }[]
  currency: string
  fetchedAt: string
}

export default function ShopifyTab() {
  const { 
    brand, shopUrl, shopAccessToken, datePreset, customStart, customEnd, hasShopifyConnection 
  } = useActiveBrand()
  const [data, setData] = useState<ShopifyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (!hasShopifyConnection || !shopUrl || !shopAccessToken) return
    setLoading(true)
    setError('')
    try {
      const { start, end } = getDateRange(datePreset)
      const params = new URLSearchParams({
        accountId: brand?.meta?.accountId || brand?.id || '',
        shopUrl: shopUrl,
        accessToken: shopAccessToken,
        startDate: customStart || start,
        endDate: customEnd || end,
      })
      const res = await fetch(`/api/shopify/orders?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [hasShopifyConnection, shopUrl, shopAccessToken, brand, datePreset, customStart, customEnd])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!hasShopifyConnection) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <ShoppingCart size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Shopify not connected</h3>
          <p className="text-sm text-gray-400">Connect your Shopify store in the brand settings to see order analytics.</p>
        </div>
      </div>
    )
  }

  const kpis = [
    {
      label: 'Gross Revenue',
      value: data ? formatCurrency(data.revenue.gross) : '–',
      icon: <DollarSign size={16} />,
      color: '#4D9EFF',
    },
    {
      label: 'Net Revenue (Delivered)',
      value: data ? formatCurrency(data.revenue.confirmed) : '–',
      icon: <TrendingUp size={16} />,
      color: '#00C48C',
    },
    {
      label: 'Lost Revenue',
      value: data ? formatCurrency(data.revenue.lost) : '–',
      icon: <TrendingDown size={16} />,
      color: '#FF4D4D',
    },
    {
      label: 'Total Orders',
      value: data ? formatNumber(data.counts.total) : '–',
      icon: <Package size={16} />,
      color: '#A78BFA',
    },
  ]

  const statusCols = [
    { label: 'Processing', key: 'Processing', color: '#4D9EFF' },
    { label: 'Pending COD', key: 'Pending COD', color: '#FFB800' },
    { label: 'Shipped', key: 'Shipped', color: '#A78BFA' },
    { label: 'Delivered', key: 'Delivered', color: '#00C48C' },
    { label: 'Cancelled', key: 'Cancelled', color: '#6B7280' },
    { label: 'Returned', key: 'Returned', color: '#FF4D4D' },
  ]

  const productCols: Column<ShopifyData['products'][0]>[] = [
    { key: 'name', header: 'Product Name', sortable: true,
      render: (v) => <span className="font-medium text-sm block max-w-xs truncate">{v as string}</span> },
    { key: 'orders', header: 'Orders', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'revenue', header: 'Revenue', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
    { key: 'delivered', header: 'Delivered', sortable: true, align: 'right', render: v => formatNumber(v as number) },
    { key: 'return_rate', header: 'Return Rate', sortable: true, align: 'right',
      render: v => <span style={{ color: (v as number) > 20 ? '#FF4D4D' : 'inherit' }}>{formatPercent(v as number)}</span> },
    { key: 'aov', header: 'AOV', sortable: true, align: 'right', render: v => formatCurrency(v as number) },
  ]

  const orderCols: Column<any>[] = [
    { key: 'id', header: 'Order ID', sortable: true, render: (v) => <span className="text-xs">#{v as string}</span> },
    { key: 'created_at', header: 'Date', sortable: true, render: (v) => <span className="text-xs">{new Date(v as string).toLocaleDateString()}</span> },
    { key: 'total_price', header: 'Amount', sortable: true, align: 'right', render: (v) => formatCurrency(parseFloat(v as string)) },
    { key: 'line_items', header: 'Items', sortable: true, align: 'right', render: (v) => <span>{v as number}</span> },
    { key: 'status', header: 'Status', sortable: true,
      render: (v) => {
        const colors: Record<string, string> = {
          Delivered: '#00C48C', Cancelled: '#6B7280', Returned: '#FF4D4D',
          Processing: '#4D9EFF', 'Pending COD': '#FFB800', Shipped: '#A78BFA'
        }
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: (colors[v as string] || '#6B7280') + '20', color: colors[v as string] }}>
            {v as string}
          </span>
        )
      }
    },
  ]

  return (
    <div className="space-y-6 pb-12">
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm flex items-center gap-2" style={{ background: '#FF4D4D20', color: '#FF4D4D' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
        ) : (
          kpis.map((k, i) => <MetricCard key={k.label} {...k} delay={i * 50} />)
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusCols.map((s, i) => {
          const count = data?.counts[s.key as keyof ShopifyData['counts']] as number || 0
          const pct = data?.counts.total ? (count / data.counts.total) * 100 : 0
          return (
            <div key={s.label} className="p-3 border rounded-xl space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-semibold">{formatNumber(count)}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Product Performance</h2>
            <button className="text-[10px] font-medium text-blue-400 hover:underline">View all</button>
          </div>
          <SortableTable
            columns={productCols}
            data={data?.products || []}
            loading={loading}
            keyField="name"
            defaultSort={{ key: 'revenue', dir: 'desc' }}
            pageSize={10}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Orders</h2>
            <button className="text-[10px] font-medium text-blue-400 hover:underline">View all</button>
          </div>
          <SortableTable
            columns={orderCols}
            data={data?.orders || []}
            loading={loading}
            keyField="id"
            pageSize={10}
          />
        </div>
      </div>
    </div>
  )
}
