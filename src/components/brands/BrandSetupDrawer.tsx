'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle, Circle, ChevronDown, ChevronUp, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { useDashboardStore, type Brand } from '@/lib/store'
import { fetchMetaAdAccounts } from '@/lib/meta'
import { signIn, useSession } from 'next-auth/react'

interface Props {
  brand: Brand
  onClose: () => void
}

// ─── Meta Connect Panel ──────────────────────────────────────────────────────
function MetaPanel({ brand, onSave }: { brand: Brand; onSave: (b: Partial<Brand>) => void }) {
  const { data: session }: any = useSession()
  const [token, setToken] = useState(brand.meta?.accessToken || '')
  const [accounts, setAccounts] = useState<{ id: string; account_id: string; name: string; currency: string }[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(
    brand.meta?.accounts?.map(a => a.id) || (brand.meta?.accountId ? [brand.meta.accountId] : [])
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'token' | 'pick'>(brand.meta ? 'pick' : 'token')

  const fetchAccounts = async (autoSelect = false) => {
    if (!token.trim()) return
    setLoading(true); setError('')
    try {
      const raw = await fetchMetaAdAccounts(token.trim())
      const mapped = raw.map((a: any) => ({
        id: a.account_id, name: a.name, currency: a.currency || 'INR', 
      }))
      setAccounts(mapped)
      setStep('pick')

      if (autoSelect && mapped.length > 0) {
        // Just show the accounts, don't auto-save
        setStep('pick')
      }
    } catch (e) { 
      const msg = (e as Error).message
      setError(msg)
      // If token is expired, go back to token input step
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('session') || msg.toLowerCase().includes('token')) {
        setStep('token')
      }
    } finally { 
      setLoading(false) 
    }
  }

  const toggleAccount = (accId: string) => {
    setSelectedIds(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    )
  }

  const handleFinalize = () => {
    const selectedAccounts = accounts.filter(a => selectedIds.includes(a.id))
    if (selectedAccounts.length === 0) {
      setError('Please select at least one account')
      return
    }
    
    onSave({ 
      meta: { 
        accessToken: token.trim(), 
        accountId: selectedAccounts[0].id, 
        accountName: selectedAccounts[0].name,
        accounts: selectedAccounts.map(a => ({ id: a.id, name: a.name })),
        currency: selectedAccounts[0].currency 
      } 
    })
  }

  const handleDisconnect = () => {
    onSave({ meta: undefined })
    setSelectedIds([]); setStep('token'); setToken(''); setAccounts([])
  }

  useEffect(() => {
    if (session?.provider === 'facebook' && session?.accessToken && session.accessToken !== token) {
      setToken(session.accessToken)
      fetchAccounts(true) // AUTO SELECT ALL
    }
  }, [session, token])

  useEffect(() => {
    if (brand.meta && step === 'pick' && accounts.length === 0 && !loading) {
      fetchAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.meta, step, accounts.length])

  if (step === 'pick') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Select Ad Accounts ({selectedIds.length} selected)
          </p>
          <button onClick={handleDisconnect} className="text-[10px] font-bold text-red-400 hover:underline">
            Disconnect
          </button>
        </div>
        
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1 no-scrollbar">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => toggleAccount(acc.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group"
              style={{ 
                borderColor: selectedIds.includes(acc.id) ? '#1877F2' : 'var(--border)',
                background: selectedIds.includes(acc.id) ? '#1877F208' : 'transparent'
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedIds.includes(acc.id) ? 'bg-[#1877F2] border-[#1877F2]' : 'border-gray-600'
                }`}>
                  {selectedIds.includes(acc.id) && <CheckCircle size={10} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold truncate group-hover:text-white transition-colors">{acc.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ID: {acc.id} · {acc.currency}</p>
                </div>
              </div>
            </button>
          ))}

          {!loading && accounts.length === 0 && (
            <div className="py-10 px-4 text-center border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-bold mb-1">No ad accounts found</p>
              <p className="text-xs text-gray-500 mb-4">Your token may be valid but lacks "ads_read" permissions.</p>
              <a 
                href="https://developers.facebook.com/tools/debug/accesstoken/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all"
              >
                Debug Token Permissions <ExternalLink size={12} />
              </a>
            </div>
          )}

          {loading && (
            <div className="py-8 flex justify-center">
              <Loader2 size={24} className="animate-spin text-[#1877F2] opacity-50" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button onClick={() => setStep('token')} className="px-4 py-2 rounded-lg text-xs font-bold border hover:bg-white/5" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            Change Token
          </button>
          <button onClick={handleFinalize} className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166fe5] shadow-lg shadow-blue-900/20">
            Confirm Selection
          </button>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Or enter ID manually</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="act_xxxxxxxxxxxx"
              id="manualAccountId"
              className="flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button 
              onClick={() => {
                const idInput = document.getElementById('manualAccountId') as HTMLInputElement
                const val = idInput?.value.trim()
                if (val) {
                   onSave({ 
                    meta: { 
                      accessToken: token.trim(), 
                      accountId: val.replace('act_', ''), 
                      accountName: 'Manual Account',
                      accounts: [{ id: val.replace('act_', ''), name: 'Manual Account' }],
                      currency: 'INR' 
                    } 
                  })
                }
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
            >
              Add
            </button>
          </div>
          <p className="text-[9px] text-gray-600 mt-2 italic">Essential for System User tokens which may not show in auto-fetch.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={() => signIn('facebook')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] shadow-xl shadow-blue-900/10 text-white text-sm font-black uppercase tracking-tight transition-all active:scale-95 group"
      >
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <CheckCircle size={14} className="text-white" />
        </div>
        Login with Meta
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Or enter manually</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Meta Access Token</label>
        <textarea
          value={token}
          onChange={e => setToken(e.target.value)}
          rows={3}
          placeholder="shpat_..."
          className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition-all"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <div className="mt-2 flex items-center justify-between">
           <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 text-[10px] font-bold hover:underline py-1" style={{ color: 'var(--accent-blue)' }}>
            <ExternalLink size={12} /> Get Access Token
          </a>
          <p className="text-[10px] text-gray-600 font-medium">Token must include ads_management</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <p className="text-xs font-semibold text-red-500">{error}</p>
        </div>
      )}

      <button onClick={() => fetchAccounts()} disabled={loading || !token.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xl shadow-blue-900/10"
        style={{ background: '#1877F2', opacity: (loading || !token.trim()) ? 0.5 : 1 }}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Fetch Associated Accounts →'}
      </button>
    </div>
  )
}

// ─── Google Connect Panel ────────────────────────────────────────────────────
function GooglePanel({ brand, onSave }: { brand: Brand; onSave: (b: Partial<Brand>) => void }) {
  const { data: session }: any = useSession()
  const [devToken, setDevToken] = useState(brand.google?.developerToken || '')
  const [refreshToken, setRefreshToken] = useState(brand.google?.refreshToken || '')
  const [customerId, setCustomerId] = useState(brand.google?.customerId || '')
  const [customerName, setCustomerName] = useState(brand.google?.customerName || '')

  useEffect(() => {
    if (session?.provider === 'google' && session?.refreshToken && session.refreshToken !== refreshToken) {
      setRefreshToken(session.refreshToken)
    }
  }, [session, refreshToken])

  const handleSave = () => {
    if (!devToken || !refreshToken || !customerId) return
    onSave({ google: { developerToken: devToken, refreshToken, customerId: customerId.replace(/-/g, ''), customerName: customerName || customerId } })
  }

  const handleDisconnect = () => {
    onSave({ google: undefined })
    setDevToken(''); setRefreshToken(''); setCustomerId(''); setCustomerName('')
  }

  if (brand.google) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
        <div>
          <p className="text-sm font-semibold">{brand.google.customerName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ID: {brand.google.customerId}</p>
        </div>
        <button onClick={handleDisconnect}
          className="text-xs px-3 py-1.5 rounded-lg border hover:bg-red-500/10 hover:text-red-400 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={() => signIn('google')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white hover:bg-gray-50 shadow-xl shadow-white/5 text-gray-900 text-sm font-black uppercase tracking-tight transition-all active:scale-95 group"
      >
        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
          <Circle size={14} className="text-[#4285F4]" />
        </div>
        Login with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Or enter manually</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="space-y-2.5 pt-1">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Developer Token</label>
          <input type="password" value={devToken} onChange={e => setDevToken(e.target.value)}
            placeholder="Developer token from Google Ads API centre"
            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Refresh Token</label>
          <input type="password" value={refreshToken} onChange={e => setRefreshToken(e.target.value)}
            placeholder="OAuth2 refresh token"
            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Customer ID</label>
            <input type="text" value={customerId} onChange={e => setCustomerId(e.target.value)}
              placeholder="123-456-7890"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Account Name</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Optional label"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <a href="https://developers.google.com/google-ads/api/docs/oauth/overview" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#34A853' }}>
            <ExternalLink size={10} /> Setup guide
          </a>
          <button onClick={handleSave} disabled={!devToken || !refreshToken || !customerId}
            className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: '#34A853', color: '#fff' }}>
            Save Google Ads →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shopify Connect Panel ───────────────────────────────────────────────────
function ShopifyPanel({ brand, onSave }: { brand: Brand; onSave: (b: Partial<Brand>) => void }) {
  const [shopUrl, setShopUrl] = useState(brand.shopify?.shopUrl || '')
  const [token, setToken] = useState(brand.shopify?.accessToken || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    if (!shopUrl || !token) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/shopify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopUrl: shopUrl.trim(), accessToken: token.trim() }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      onSave({ shopify: { shopUrl: json.shop.url, accessToken: token.trim(), shopName: json.shop.name, currency: json.shop.currency } })
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const handleDisconnect = () => {
    onSave({ shopify: undefined })
    setShopUrl(''); setToken('')
  }

  if (brand.shopify) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
        <div>
          <p className="text-sm font-semibold">{brand.shopify.shopName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {brand.shopify.shopUrl} · {brand.shopify.currency}
          </p>
        </div>
        <button onClick={handleDisconnect}
          className="text-xs px-3 py-1.5 rounded-lg border hover:bg-red-500/10 hover:text-red-400 transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Shop URL</label>
        <input type="text" value={shopUrl} onChange={e => setShopUrl(e.target.value)}
          placeholder="mystore.myshopify.com"
          className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
      </div>
      <div className="space-y-1">
        <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Admin API Access Token</label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)}
          placeholder="shpat_xxxxxxxxxxxxx"
          className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
      </div>
      {error && <p className="text-xs" style={{ color: '#FF4D4D' }}>{error}</p>}
      <div className="flex items-center justify-between">
        <a href="https://help.shopify.com/en/manual/apps/custom-apps" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#00C48C' }}>
          <ExternalLink size={10} /> How to get token
        </a>
        <button onClick={handleConnect} disabled={loading || !shopUrl || !token}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: '#00C48C', color: '#fff' }}>
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Connecting...' : 'Connect Shopify →'}
        </button>
      </div>
    </div>
  )
}

// ─── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({
  icon, title, subtitle, connected, accentColor, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  connected: boolean
  accentColor: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!connected)

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: connected ? accentColor + '40' : 'var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accentColor + '20', color: accentColor }}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
              style={{ background: accentColor + '20', color: accentColor }}>
              <CheckCircle size={11} /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
              <Circle size={11} /> Not connected
            </span>
          )}
          {open ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function BrandSetupDrawer({ brand, onClose }: Props) {
  const { updateBrand } = useDashboardStore()

  const save = (patch: Partial<Brand>) => {
    updateBrand(brand.id, patch).catch(console.error)
  }

  // Get latest brand state from store
  const { brands } = useDashboardStore()
  const live = brands.find(b => b.id === brand.id) || brand

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col shadow-2xl"
        style={{ width: '480px', background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{ background: live.color }}>
              {live.name[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-sm">{live.name}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Brand setup</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Connect data sources for this brand. You can skip any and set it up later.
          </p>

          {/* Meta */}
          <IntegrationCard
            icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V9h2v8zm4 0h-2V9h2v8z"/></svg>}
            title="Meta Ads"
            subtitle="Facebook & Instagram ad campaigns"
            connected={!!live.meta}
            accentColor="#1877F2"
          >
            <MetaPanel brand={live} onSave={save} />
          </IntegrationCard>

          {/* Google */}
          <IntegrationCard
            icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
            title="Google Ads"
            subtitle="Search, Shopping & Display campaigns"
            connected={!!live.google}
            accentColor="#34A853"
          >
            <GooglePanel brand={live} onSave={save} />
          </IntegrationCard>

          {/* Shopify */}
          <IntegrationCard
            icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.337 23.979l7.216-1.561s-2.597-17.566-2.617-17.693c-.02-.127-.127-.211-.232-.211s-2.111-.148-2.111-.148-.84-.83-1.026-1.02v-.084l-.61-16.958c-.021-.043-.041-.043-.064-.043L15.337 23.979z"/></svg>}
            title="Shopify"
            subtitle="Orders, revenue & product performance"
            connected={!!live.shopify}
            accentColor="#00C48C"
          >
            <ShopifyPanel brand={live} onSave={save} />
          </IntegrationCard>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: live.color, color: '#fff' }}
          >
            Done — Go to Dashboard
          </button>
        </div>
      </div>
    </>
  )
}
