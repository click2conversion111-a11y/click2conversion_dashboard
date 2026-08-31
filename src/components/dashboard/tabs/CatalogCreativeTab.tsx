'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Image as ImageIcon, Video, ShoppingBag, LayoutGrid, Info, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badges'
import ConditionalFormatter from '@/components/ui/ConditionalFormatter'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { formatCurrency, formatNumber, formatPercent, getDateRange } from '@/lib/utils'

type CreativeType = 'Catalog' | 'Reel' | 'Static' | 'Carousel' | 'Other'

interface AdEntry {
  ad_id: string
  ad_name: string
  adset_name: string
  campaign_name: string
  ad_status: string
  creative_type: string
  sub_type: string
  thumbnail_url: string | null
  spend: number
  revenue: number
  roas: number
  purchases: number
  ctr: number
  cpc: number
  cpm: number
  cpp: number
  impressions: number
  clicks: number
  hook_rate?: number
}

interface CreativeBucket {
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
}

interface CreativeData {
  data: Record<string, CreativeBucket>
  fetchedAt: string
}

const TYPE_META: Record<CreativeType, { icon: any; label: string; color: string; description: string }> = {
  Catalog: { 
    icon: <ShoppingBag size={18} />, 
    label: 'Catalog (DPA)', 
    color: '#4D9EFF',
    description: 'Dynamic Product Ads using your Shopify catalog. Automated for retargeting and broad audiences.'
  },
  Reel: { 
    icon: <Video size={18} />, 
    label: 'Reels / Video', 
    color: '#A78BFA',
    description: 'Short-form vertical video or traditional 4:5 video content. Key for brand storytelling.'
  },
  Static: { 
    icon: <ImageIcon size={18} />, 
    label: 'Static Creative', 
    color: '#FFB800',
    description: 'Single image assets. Often the bedrock of consistent purchase performance.'
  },
  Carousel: { 
    icon: <LayoutGrid size={18} />, 
    label: 'Carousel', 
    color: '#00C48C',
    description: 'Multiple images or videos in a scrollable format. Great for product collections.'
  },
  Other: { 
    icon: <Info size={18} />, 
    label: 'Other', 
    color: '#6B7280',
    description: 'Ads with mixed or undefined creative formats.'
  },
}

const TYPES: CreativeType[] = ['Catalog', 'Reel', 'Static', 'Carousel']

function SubTypeTable({ ads, searchQuery, metaCurrency }: { ads: AdEntry[]; searchQuery: string; metaCurrency: string }) {
  const subTypeMap = useMemo(() => {
    const map: Record<string, { ads: number; spend: number; revenue: number; roas: number }> = {}
    for (const ad of ads) {
      if (!map[ad.sub_type]) map[ad.sub_type] = { ads: 0, spend: 0, revenue: 0, roas: 0 }
      map[ad.sub_type].ads++
      map[ad.sub_type].spend += ad.spend
      map[ad.sub_type].revenue += ad.revenue
    }
    for (const v of Object.values(map)) {
      v.roas = v.spend > 0 ? v.revenue / v.spend : 0
    }
    return map
  }, [ads])

  const rows = Object.entries(subTypeMap).filter(([key]) => !searchQuery || key.toLowerCase().includes(searchQuery.toLowerCase()))
  if (rows.length === 0) return null

  return (
    <div className="rounded-lg overflow-hidden border mt-3" style={{ background: 'black/10', borderColor: 'var(--border)' }}>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            {['Subtype', 'Ads', 'Spend', 'ROAS'].map(h => (
              <th key={h} className="px-3 py-1.5 text-left font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([type, v]) => (
            <tr key={type}>
              <td className="px-3 py-1.5 font-medium">{type}</td>
              <td className="px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>{v.ads}</td>
              <td className="px-3 py-1.5">{formatCurrency(v.spend, metaCurrency)}</td>
              <td className="px-3 py-1.5">
                <ConditionalFormatter metric="roas" value={v.roas} format={x => `${x.toFixed(2)}x`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdListTable({ ads, accountId, searchQuery, metaCurrency }: { ads: AdEntry[]; accountId?: string; searchQuery: string; metaCurrency: string }) {
  const filtered = searchQuery
    ? ads.filter(a =>
        a.ad_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.sub_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ads

  return (
    <div className="rounded-xl overflow-hidden border bg-black/20" style={{ borderColor: 'var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['', 'Ad Details', 'Format', 'Spend', 'ROAS', 'Orders', 'CPP', 'CTR', 'Hook'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(ad => (
              <tr key={ad.ad_id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <td className="px-3 py-2">
                  <div className="relative group">
                    {ad.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.thumbnail_url} alt="" width={44} height={44} className="rounded-lg object-cover shadow-sm bg-white/5" loading="lazy" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--surface-2)' }}>🎨</div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 min-w-[200px]">
                  <p className="font-semibold truncate text-[13px]">{ad.ad_name}</p>
                  <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>{ad.campaign_name}</p>
                </td>
                <td className="px-3 py-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10" style={{ color: 'var(--text-secondary)' }}>
                    {ad.sub_type}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">{formatCurrency(ad.spend, metaCurrency)}</td>
                <td className="px-3 py-2">
                  <ConditionalFormatter metric="roas" value={ad.roas} accountId={accountId} format={x => `${x.toFixed(2)}x`} />
                </td>
                <td className="px-3 py-2">{formatNumber(ad.purchases)}</td>
                <td className="px-3 py-2">
                  <ConditionalFormatter metric="cpp" value={ad.cpp} accountId={accountId} format={x => formatCurrency(x, metaCurrency)} />
                </td>
                <td className="px-3 py-2">{formatPercent(ad.ctr)}</td>
                <td className="px-3 py-2">
                  {ad.hook_rate !== undefined ? (
                    <span className="text-[11px] font-semibold" style={{ color: ad.hook_rate > 30 ? '#00C48C' : ad.hook_rate > 20 ? '#FFB800' : '#FF4D4D' }}>
                      {ad.hook_rate.toFixed(1)}%
                    </span>
                  ) : <span className="text-[11px] opacity-40">–</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-12 text-center" style={{ color: 'var(--text-muted)' }}>No ads found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CreativeCard({
  type, bucket, totalSpend, accountId, searchQuery, metaCurrency,
}: {
  type: CreativeType
  bucket: CreativeBucket
  totalSpend: number
  accountId?: string
  searchQuery: string
  metaCurrency: string
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[type]
  const spendPct = totalSpend > 0 ? (bucket.spend / totalSpend) * 100 : 0

  return (
    <div className="rounded-2xl border transition-all hover:shadow-lg h-fit group" 
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" 
              style={{ background: `${meta.color}15`, color: meta.color }}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{meta.label}</h3>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider transition-colors group-hover:bg-white/5"
              style={{ borderColor: `${meta.color}40`, color: meta.color }}>
              {spendPct.toFixed(1)}% Spend
            </span>
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-3 gap-6 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Spend</p>
            <p className="text-lg font-bold mt-1 tracking-tight">{formatCurrency(bucket.spend, metaCurrency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Revenue</p>
            <p className="text-lg font-bold mt-1 tracking-tight">{formatCurrency(bucket.revenue, metaCurrency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Orders</p>
            <p className="text-lg font-bold mt-1 tracking-tight">{formatNumber(bucket.purchases)}</p>
          </div>
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>ROAS</p>
            <div className="mt-1">
              <ConditionalFormatter metric="roas" value={bucket.roas} accountId={accountId} format={x => `${x.toFixed(2)}x`} className="text-lg font-bold tracking-tight" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>CPP</p>
            <div className="mt-1">
              <ConditionalFormatter metric="cpp" value={bucket.cpp} accountId={accountId} format={x => formatCurrency(x, metaCurrency)} className="text-lg font-bold tracking-tight" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>CPM</p>
            <p className="text-lg font-bold mt-1 tracking-tight">{formatCurrency(bucket.cpm, metaCurrency)}</p>
          </div>
        </div>


        {/* Secondary Metrics Bar */}
        <div className="flex items-center justify-between py-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-4">
            <span>{formatNumber(bucket.ads.length)} Ads</span>
            <span className="opacity-20">|</span>
            <span>{formatPercent(bucket.ctr)} CTR</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color: 'var(--text-muted)' }}>Conversion</span>
            <span>{formatNumber(bucket.purchases)} Orders</span>
            <span className="opacity-40 ml-1 text-[10px]">AOV: {formatCurrency(bucket.purchases > 0 ? bucket.revenue/bucket.purchases : 0, metaCurrency)}</span>
          </div>
        </div>


        {/* Dynamic spend progress bar */}
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" 
            style={{ width: `${spendPct}%`, background: meta.color }} />
        </div>

        {/* Sub-types overview */}
        {bucket.ads.length > 0 && <SubTypeTable ads={bucket.ads} searchQuery={searchQuery} metaCurrency={metaCurrency} />}
      </div>

      {/* Footer / Expand */}
      {bucket.ads.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full px-6 py-3.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest border-t transition-all hover:bg-white/[0.04]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-2">
              {expanded ? 'Hide Ads' : `View ${bucket.ads.length} Ads`} 
              <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
            </span>
          </button>
          
          {expanded && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
              <AdListTable ads={bucket.ads} accountId={accountId} searchQuery={searchQuery} metaCurrency={metaCurrency} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function CatalogCreativeTab() {
  const { accountId, accessToken, brand, datePreset, customStart, customEnd, metaCurrency } = useActiveBrand()
  const [creativeData, setCreativeData] = useState<CreativeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'All' | CreativeType>('All')

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
        startDate: customStart || start,
        endDate: customEnd || end,
      })
      const res = await fetch(`/api/meta/creative-breakdown?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setCreativeData(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [accountId, accessToken, datePreset, customStart, customEnd])

  useEffect(() => { fetchData() }, [fetchData])

  const buckets = creativeData?.data || {}
  const totalSpend = Object.values(buckets).reduce((s, b) => s + b.spend, 0)
  const visibleTypes = activeFilter === 'All' ? TYPES : [activeFilter as CreativeType]

  const noData = !loading && Object.keys(buckets).length === 0

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Catalog vs Creative</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyze performance by creative type and asset format.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-2 rounded-xl border min-w-[300px]" 
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search ads..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>
      </div>

      {error && (
        <div className="px-5 py-4 rounded-xl border flex items-center gap-3" style={{ background: '#FF4D4D15', borderColor: '#FF4D4D40', color: '#FF4D4D' }}>
          <Info size={20} />
          <div>
            <p className="font-bold text-sm">Failed to fetch creative data</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex overflow-x-auto pb-1 no-scrollbar gap-2">
        {(['All', ...TYPES] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f as typeof activeFilter)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: activeFilter === f ? 'var(--accent-blue)' : 'var(--surface)',
              color: activeFilter === f ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeFilter === f ? 'transparent' : 'var(--border)'}`,
              boxShadow: activeFilter === f ? '0 8px 16px -4px rgba(77, 158, 255, 0.4)' : 'none'
            }}
          >
            {f === 'All' ? '🌐 All Formats' : <>{TYPE_META[f as CreativeType].icon} {f}</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[420px] rounded-2xl" />
          ))}
        </div>
      ) : noData ? (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl">🎨</div>
           <div>
             <h3 className="text-lg font-bold">No Creative Data found</h3>
             <p className="text-sm opacity-60">There may be no active ads with spending for the selected time range.</p>
           </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {visibleTypes.map(type => {
            const bucket = buckets[type]
            if (!bucket || (search && bucket.ads.every(a =>
              !a.ad_name.toLowerCase().includes(search.toLowerCase()) &&
              !a.campaign_name.toLowerCase().includes(search.toLowerCase()) &&
              !a.sub_type.toLowerCase().includes(search.toLowerCase())
            ))) return null
            return (
              <CreativeCard
                key={type}
                type={type}
                bucket={bucket}
                totalSpend={totalSpend}
                accountId={accountId}
                searchQuery={search}
                metaCurrency={metaCurrency}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
