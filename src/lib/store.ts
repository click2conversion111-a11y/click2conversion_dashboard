'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DatePreset } from './utils'

// ─── Brand & connection types ───────────────────────────────────────────────

export interface MetaAccount {
  id: string
  name: string
}

export interface MetaConnection {
  accessToken: string
  accountId: string      // backward compatibility for first account
  accountName: string
  accounts: MetaAccount[] // multiple accounts
  currency: string
}

export interface GoogleConnection {
  developerToken: string
  refreshToken: string
  customerId: string   // MCC or direct customer id
  customerName: string
}

export interface ShopifyConnection {
  shopUrl: string       // mystore.myshopify.com
  accessToken: string
  shopName: string
  currency: string
}

export interface Brand {
  id: string
  name: string
  color: string         // hex accent colour for this brand
  createdAt: string
  meta?: MetaConnection
  google?: GoogleConnection
  shopify?: ShopifyConnection
}

// ─── Store ────────────────────────────────────────────────────────────────

interface DashboardStore {
  // Brands
  brands: Brand[]
  selectedBrandId: string | null
  brandsLoaded: boolean
  loadBrands: () => Promise<void>
  createBrand: (name: string, color: string) => Promise<Brand>
  updateBrand: (id: string, patch: Partial<Brand>) => Promise<void>
  deleteBrand: (id: string) => Promise<void>
  selectBrand: (id: string) => void

  // Derived helper (non-persisted)
  selectedBrand: () => Brand | null

  // Date range
  datePreset: DatePreset
  customStart: string | null
  customEnd: string | null
  setDatePreset: (preset: DatePreset, start?: string, end?: string) => void

  // Filters
  salesOnly: boolean
  setSalesOnly: (v: boolean) => void

  // Active tab
  activeTab: string
  setActiveTab: (tab: string) => void

  // Settings Drawer
  isSettingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function dbRowToBrand(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    meta: row.meta ?? undefined,
    google: row.google ?? undefined,
    shopify: row.shopify ?? undefined,
  }
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      brands: [],
      selectedBrandId: null,
      brandsLoaded: false,

      loadBrands: async () => {
        try {
          const rows = await apiFetch('/api/brands')
          const brands = rows.map(dbRowToBrand)
          set(s => ({
            brands,
            brandsLoaded: true,
            selectedBrandId:
              s.selectedBrandId && brands.find((b: Brand) => b.id === s.selectedBrandId)
                ? s.selectedBrandId
                : brands[0]?.id ?? null,
          }))
        } catch {
          set({ brandsLoaded: true })
        }
      },

      createBrand: async (name, color) => {
        const row = await apiFetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, color }),
        })
        const brand = dbRowToBrand(row)
        set(s => ({ brands: [...s.brands, brand], selectedBrandId: brand.id }))
        return brand
      },

      updateBrand: async (id, patch) => {
        const existing = get().brands.find(b => b.id === id)
        if (!existing) return
        const merged = { ...existing, ...patch }
        await apiFetch(`/api/brands/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: merged.name,
            color: merged.color,
            meta: merged.meta ?? null,
            google: merged.google ?? null,
            shopify: merged.shopify ?? null,
          }),
        })
        set(s => ({
          brands: s.brands.map(b => b.id === id ? merged : b),
        }))
      },

      deleteBrand: async (id) => {
        await apiFetch(`/api/brands/${id}`, { method: 'DELETE' })
        set(s => {
          const remaining = s.brands.filter(b => b.id !== id)
          return {
            brands: remaining,
            selectedBrandId:
              s.selectedBrandId === id
                ? (remaining[0]?.id ?? null)
                : s.selectedBrandId,
          }
        })
      },

      selectBrand: (id) => set({ selectedBrandId: id }),

      selectedBrand: () => {
        const { brands, selectedBrandId } = get()
        return brands.find(b => b.id === selectedBrandId) ?? null
      },

      datePreset: 'today',
      customStart: null,
      customEnd: null,
      setDatePreset: (preset, start, end) =>
        set({ datePreset: preset, customStart: start ?? null, customEnd: end ?? null }),

      salesOnly: false,
      setSalesOnly: (v) => set({ salesOnly: v }),

      activeTab: 'summary',
      setActiveTab: (tab) => set({ activeTab: tab }),

      isSettingsOpen: false,
      setSettingsOpen: (v) => set({ isSettingsOpen: v }),
    }),
    {
      name: 'd2c-dashboard-v3',
      partialize: (s) => ({
        selectedBrandId: s.selectedBrandId,
        datePreset: s.datePreset,
        customStart: s.customStart,
        customEnd: s.customEnd,
        salesOnly: s.salesOnly,
      }),
    }
  )
)
