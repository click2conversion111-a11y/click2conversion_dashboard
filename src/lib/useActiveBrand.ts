'use client'
import { useDashboardStore } from './store'

/**
 * Returns the selected brand's Meta and Shopify credentials in a simple shape.
 */
export function useActiveBrand() {
  const { selectedBrand, datePreset, customStart, customEnd, salesOnly, setSalesOnly } = useDashboardStore()
  const brand = selectedBrand()
  const meta = brand?.meta
  const shopify = brand?.shopify

  return {
    brand,
    // Meta credentials
    accountId: meta?.accounts?.map(a => a.id).join(',') || (meta?.accountId ?? ''),
    accessToken: meta?.accessToken ?? '',
    accountName: meta?.accountName ?? '',
    metaCurrency: meta?.currency ?? 'INR',
    hasMetaConnection: !!meta,

    // Shopify credentials
    shopUrl: shopify?.shopUrl ?? '',
    shopAccessToken: shopify?.accessToken ?? '',
    shopName: shopify?.shopName ?? '',
    shopifyCurrency: shopify?.currency ?? 'INR',
    hasShopifyConnection: !!shopify,

    // date range
    datePreset,
    customStart,
    customEnd,
    salesOnly,
    setSalesOnly,
  }
}
