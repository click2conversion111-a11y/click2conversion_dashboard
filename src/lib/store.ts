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
  createBrand: (name: string, color: string) => Brand
  updateBrand: (id: string, patch: Partial<Brand>) => void
  deleteBrand: (id: string) => void
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

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      brands: [],
      selectedBrandId: null,

      createBrand: (name, color) => {
        const brand: Brand = { id: makeId(), name, color, createdAt: new Date().toISOString() }
        set(s => ({ brands: [...s.brands, brand], selectedBrandId: brand.id }))
        return brand
      },

      updateBrand: (id, patch) =>
        set(s => ({
          brands: s.brands.map(b => b.id === id ? { ...b, ...patch } : b),
        })),

      deleteBrand: (id) =>
        set(s => {
          const remaining = s.brands.filter(b => b.id !== id)
          return {
            brands: remaining,
            selectedBrandId:
              s.selectedBrandId === id
                ? (remaining[0]?.id ?? null)
                : s.selectedBrandId,
          }
        }),

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
      name: 'd2c-dashboard-v2',
      partialize: (s) => ({
        brands: s.brands,
        selectedBrandId: s.selectedBrandId,
        datePreset: s.datePreset,
        customStart: s.customStart,
        customEnd: s.customEnd,
        salesOnly: s.salesOnly,
      }),
    }
  )
)
