'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, Settings, Plus, Trash2, Zap, Pencil } from 'lucide-react'
import { useDashboardStore, type Brand } from '@/lib/store'
import { useRouter } from 'next/navigation'
import CreateBrandModal from '@/components/brands/CreateBrandModal'
import BrandSetupDrawer from '@/components/brands/BrandSetupDrawer'

function ConnectionDots({ brand }: { brand: Brand }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-full"
        title={brand.meta ? 'Meta connected' : 'Meta not connected'}
        style={{ background: brand.meta ? '#1877F2' : 'var(--border)' }}
      />
      <span
        className="w-2 h-2 rounded-full"
        title={brand.google ? 'Google connected' : 'Google not connected'}
        style={{ background: brand.google ? '#34A853' : 'var(--border)' }}
      />
      <span
        className="w-2 h-2 rounded-full"
        title={brand.shopify ? 'Shopify connected' : 'Shopify not connected'}
        style={{ background: brand.shopify ? '#00C48C' : 'var(--border)' }}
      />
    </div>
  )
}

export default function TopBar() {
  const { brands, selectedBrandId, selectBrand, deleteBrand, selectedBrand, isSettingsOpen, setSettingsOpen } = useDashboardStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [setupBrand, setSetupBrand] = useState<Brand | null>(null)
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const active = mounted ? selectedBrand() : null

  // Keep setupBrand in sync with global drawer state
  useEffect(() => {
    if (isSettingsOpen && !setupBrand && active) {
      setSetupBrand(active)
    } else if (!isSettingsOpen && setupBrand) {
      setSetupBrand(null)
    }
  }, [isSettingsOpen, setupBrand, active])

  const handleCreated = (id: string) => {
    setShowCreate(false)
    const brand = brands.find(b => b.id === id)
    if (brand) {
      setSetupBrand(brand)
      setSettingsOpen(true)
    }
  }

  const handleCloseDrawer = () => {
    setSetupBrand(null)
    setSettingsOpen(false)
  }

  return (
    <>
      <div
        className="h-14 flex items-center justify-between px-6 border-b sticky top-0 z-30"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4D9EFF, #A78BFA)' }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            D2C Analytics
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Brand switcher */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {active ? (
                <>
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: active.color }}
                  >
                    {active.name[0].toUpperCase()}
                  </div>
                  <span className="max-w-[160px] truncate font-medium">{active.name}</span>
                  <ConnectionDots brand={active} />
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Select brand</span>
              )}
              <ChevronDown size={13} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', minWidth: '260px' }}
                >
                  {brands.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        Your Brands
                      </p>
                      {brands.map(b => (
                        <div key={b.id} className="flex items-center gap-1 rounded-lg hover:bg-white/5 group">
                          <button
                            onClick={() => { selectBrand(b.id); setShowDropdown(false) }}
                            className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left"
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: b.color }}
                            >
                              {b.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                  {b.name}
                                </span>
                                {selectedBrandId === b.id && (
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                                )}
                              </div>
                              <ConnectionDots brand={b} />
                            </div>
                          </button>
                          <div className="flex items-center gap-0.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setShowDropdown(false); setSetupBrand(b); setSettingsOpen(true) }}
                              className="p-1.5 rounded-lg hover:bg-white/10"
                              style={{ color: 'var(--text-muted)' }}
                              title="Edit connections"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => deleteBrand(b.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                              style={{ color: 'var(--text-muted)' }}
                              title="Delete brand"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                    </div>
                  )}

                  <div className="p-2">
                    <button
                      onClick={() => { setShowDropdown(false); setShowCreate(true) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
                      style={{ color: 'var(--accent-blue)' }}
                    >
                      <Plus size={14} />
                      New Brand
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateBrandModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {setupBrand && (
        <BrandSetupDrawer
          brand={setupBrand}
          onClose={handleCloseDrawer}
        />
      )}
    </>
  )
}
