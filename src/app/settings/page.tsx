'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Settings, Palette, ShoppingBag } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { useDashboardStore } from '@/lib/store'

export default function SettingsPage() {
  const router = useRouter()
  const { selectedBrand } = useDashboardStore()
  const brand = selectedBrand()

  const settingsItems = [
    {
      icon: <Palette size={16} />,
      title: 'Conditional Formatting',
      description: 'Configure ROAS, CPP & other metric color thresholds per brand',
      href: `/settings/formatting/${brand?.id || 'default'}`,
      color: '#A78BFA',
    },
    {
      icon: <ShoppingBag size={16} />,
      title: 'Shopify Integration',
      description: 'Connect your Shopify store for real order data & ROAS comparison',
      href: '/settings/shopify',
      color: '#00C48C',
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <TopBar />
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>

        {brand && (
          <div className="px-4 py-3 rounded-xl border text-sm flex items-center gap-2"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: brand.color }} />
            <span className="font-medium">{brand.name}</span>
            {brand.meta && (
              <span style={{ color: 'var(--text-muted)' }}>· Meta: {brand.meta.accountName}</span>
            )}
          </div>
        )}

        <div className="space-y-3">
          {settingsItems.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full text-left rounded-xl border p-5 hover:bg-white/[0.02] transition-colors flex items-center justify-between"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}20`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
