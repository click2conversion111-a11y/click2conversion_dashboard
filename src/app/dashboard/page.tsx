'use client'
import { Suspense, lazy, useState, useEffect } from 'react'
import { Download, Brain, ToggleLeft, ToggleRight, Plus, Zap, Pencil } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import DateRangeSelector from '@/components/ui/DateRangeSelector'
import CreateBrandModal from '@/components/brands/CreateBrandModal'
import BrandSetupDrawer from '@/components/brands/BrandSetupDrawer'
import { useDashboardStore, type Brand } from '@/lib/store'
import { useActiveBrand } from '@/lib/useActiveBrand'
import { getDateRange, getDatePresetLabel } from '@/lib/utils'
import AIChatBot from '@/components/dashboard/AIChatBot'

import AISummaryModal from '@/components/dashboard/AISummaryModal'

const SummaryTab = lazy(() => import('@/components/dashboard/tabs/SummaryTab'))
const CampaignsTab = lazy(() => import('@/components/dashboard/tabs/CampaignsTab'))
const AdSetsTab = lazy(() => import('@/components/dashboard/tabs/AdSetsTab'))
const AdsTab = lazy(() => import('@/components/dashboard/tabs/AdsTab'))
const BreakdownTab = lazy(() => import('@/components/dashboard/tabs/BreakdownTab'))
const CatalogCreativeTab = lazy(() => import('@/components/dashboard/tabs/CatalogCreativeTab'))
const ShopifyTab = lazy(() => import('@/components/dashboard/tabs/ShopifyTab'))

const TABS = [
  { key: 'summary', label: 'Summary', show: true },
  { key: 'shopify', label: 'Shopify', show: 'shopify' },
  { key: 'campaigns', label: 'Campaigns', show: 'meta' },
  { key: 'adsets', label: 'Ad Sets', show: 'meta' },
  { key: 'ads', label: 'Ads', show: 'meta' },
  { key: 'breakdown', label: 'Breakdown', show: 'meta' },
  { key: 'creative', label: 'Catalog vs Creative', show: 'meta' },
]

function TabSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-28 rounded-xl" />
      ))}
    </div>
  )
}

function EmptyState({ onCreateBrand }: { onCreateBrand: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #4D9EFF15, #A78BFA15)' }}
      >
        <Zap size={36} style={{ color: '#A78BFA' }} />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">No brand yet</h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Create a brand and connect Meta Ads, Google Ads, and Shopify to start seeing performance data.
        </p>
      </div>
      <button
        onClick={onCreateBrand}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
        style={{ background: 'linear-gradient(135deg, #4D9EFF, #A78BFA)', color: '#fff' }}
      >
        <Plus size={16} /> Create your first brand
      </button>
    </div>
  )
}

function NoMetaState({ brand, onSetup }: { brand: Brand; onSetup: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-5">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
        style={{ background: brand.color }}
      >
        {brand.name[0].toUpperCase()}
      </div>
      <div className="text-center space-y-1.5">
        <h2 className="text-lg font-semibold">{brand.name}</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Meta Ads is not connected for this brand.
        </p>
      </div>
      <button
        onClick={onSetup}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm"
        style={{ background: '#1877F220', color: '#4D9EFF', border: '1px solid #1877F240' }}
      >
        <Pencil size={14} /> Connect Meta Ads
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const {
    brands,
    selectedBrand,
    activeTab,
    setActiveTab,
    datePreset,
    customStart,
    customEnd,
    salesOnly,
    setSalesOnly,
  } = useDashboardStore()

  const { hasMetaConnection, hasShopifyConnection } = useActiveBrand()

  const [mounted, setMounted] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [setupBrand, setSetupBrand] = useState<Brand | null>(null)
  const [showAISummary, setShowAISummary] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const brand = selectedBrand()

  const { start, end } = getDateRange(datePreset)
  const startStr = customStart || start
  const endStr = customEnd || end
  const dateLabel = getDatePresetLabel(
    datePreset,
    customStart ? new Date(customStart) : undefined,
    customEnd ? new Date(customEnd) : undefined,
  )

  const handleCreated = (id: string) => {
    setShowCreate(false)
    const b = brands.find(x => x.id === id)
    if (b) setSetupBrand(b)
  }

  const visibleTabs = TABS.filter(t => {
    if (t.show === true) return true
    if (t.show === 'meta') return hasMetaConnection
    if (t.show === 'shopify') return hasShopifyConnection
    return false
  })

  // Ensure active tab is still valid for this brand
  if (activeTab !== 'summary' && !visibleTabs.find(t => t.key === activeTab)) {
    setActiveTab('summary')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
        <TopBar />
      </div>
    )
  }


  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <TopBar />

      {/* No brand at all */}
      {!brand ? (
        <EmptyState onCreateBrand={() => setShowCreate(true)} />
      ) : (!brand.meta && !brand.shopify) ? (
        /* Brand exists but nothing connected */
        <NoMetaState brand={brand} onSetup={() => setSetupBrand(brand)} />
      ) : (

        /* Full dashboard */
        <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-4 gap-4">
          {/* Tab bar */}
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-4 pt-3 pb-0 gap-2 flex-wrap">
              <div className="flex gap-1 overflow-x-auto pb-3">
                {visibleTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}

                    className="px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all relative"
                    style={{
                      color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: activeTab === tab.key ? 'var(--surface-2)' : 'transparent',
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                        style={{ background: brand.color }} />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pb-3 flex-shrink-0">
                <button
                  onClick={() => setSalesOnly(!salesOnly)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: salesOnly ? brand.color : 'var(--text-secondary)',
                    background: salesOnly ? brand.color + '15' : 'transparent',
                  }}
                >
                  {salesOnly ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {salesOnly ? 'Sales Only' : 'All'}
                </button>

                <DateRangeSelector />

                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center border hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <Download size={14} />
                </button>

                <button
                  onClick={() => setShowAISummary(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}
                >
                  <Brain size={14} />
                  AI Summary
                </button>
              </div>
            </div>

            {/* Subheader */}
            <div
              className="px-4 py-2 border-t text-xs flex items-center gap-2 flex-wrap"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: brand.color }} />
              <span className="font-medium" style={{ color: brand.color }}>{brand.name}</span>
              <span className="opacity-40">·</span>
              <span>
                Viewing: <span style={{ color: 'var(--text-secondary)' }}>{startStr}</span>
                {' '}to{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{endStr}</span>
              </span>
              <span className="opacity-40">|</span>
              <span>{dateLabel}</span>
              {salesOnly && (
                <>
                  <span className="opacity-40">|</span>
                  <span style={{ color: brand.color }}>Purchase campaigns only</span>
                </>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1">
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === 'summary' && <SummaryTab />}
              {activeTab === 'shopify' && <ShopifyTab />}
              {activeTab === 'campaigns' && <CampaignsTab />}

              {activeTab === 'adsets' && <AdSetsTab />}
              {activeTab === 'ads' && <AdsTab />}
              {activeTab === 'breakdown' && <BreakdownTab />}
              {activeTab === 'creative' && <CatalogCreativeTab />}
            </Suspense>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateBrandModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {setupBrand && (
        <BrandSetupDrawer brand={setupBrand} onClose={() => setSetupBrand(null)} />
      )}

      {showAISummary && (
        <AISummaryModal 
          onClose={() => setShowAISummary(false)} 
          data={{
            brand,
            activeTab,
            // We can add more context here if needed
          }} 
        />
      )}

      <AIChatBot context={{ brand, datePreset, customStart, customEnd }} />
    </div>
  )
}
