'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { useDashboardStore } from '@/lib/store'

export default function ShopifySettingsPage() {
  const router = useRouter()
  const { selectedBrand, updateBrand } = useDashboardStore()
  const brand = selectedBrand()

  const [shopUrl, setShopUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const connection = brand?.shopify ?? null

  const handleConnect = async () => {
    if (!shopUrl || !accessToken || !brand) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/shopify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopUrl: shopUrl.trim(), accessToken: accessToken.trim() }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      updateBrand(brand.id, {
        shopify: {
          shopUrl: json.shop.url,
          accessToken: accessToken.trim(),
          shopName: json.shop.name,
          currency: json.shop.currency,
        },
      })
      setShopUrl('')
      setAccessToken('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    if (!brand) return
    updateBrand(brand.id, { shopify: undefined })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <TopBar />
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: '#00C48C' }} />
            <h1 className="text-lg font-semibold">Shopify Integration</h1>
          </div>
        </div>

        {connection ? (
          <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#00C48C20' }}>
                  <CheckCircle size={20} style={{ color: '#00C48C' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{connection.shopName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {connection.shopUrl} · {connection.currency}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: '#00C48C20', color: '#00C48C' }}>
                  Connected
                </span>
                <button onClick={handleDisconnect}
                  className="text-xs px-3 py-1.5 rounded-lg border hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(107,114,128,0.2)' }}>
                <XCircle size={20} style={{ color: '#6B7280' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Not Connected</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {brand ? 'Connect Shopify for real order data & accurate ROAS' : 'Select a brand first'}
                </p>
              </div>
            </div>

            {brand && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Shop URL
                  </label>
                  <input
                    type="text"
                    value={shopUrl}
                    onChange={e => setShopUrl(e.target.value)}
                    placeholder="mystore.myshopify.com"
                    className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Admin API Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    placeholder="shpat_xxxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <a href="https://help.shopify.com/en/manual/apps/custom-apps" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs mt-1.5 hover:underline"
                    style={{ color: 'var(--accent-blue)' }}>
                    <ExternalLink size={10} /> How to get an access token
                  </a>
                </div>

                {error && (
                  <p className="text-sm px-4 py-3 rounded-lg" style={{ background: '#FF4D4D20', color: '#FF4D4D' }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading || !shopUrl || !accessToken}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #00C48C, #00A371)', color: '#fff' }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Testing connection...' : 'Connect Shopify Store'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="rounded-xl border p-5 space-y-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold">What you get with Shopify</h3>
          <ul className="space-y-2">
            {[
              'Real order data: Delivered, Shipped, Pending COD, Cancelled, Returned',
              'Actual ROAS vs Meta Reported ROAS comparison',
              'Pixel over-reporting detection with warning banners',
              'Product-level revenue and return rate breakdown',
              'Automatic product detection for campaign-to-product matching',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: '#00C48C' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
