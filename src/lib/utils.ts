import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: '$',
  AUD: '$',
  AED: 'AED ',
}

export function formatCurrency(value: number, currencyCode: string = 'INR') {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode + ' '
  
  // Use Indian notation (Cr/L) only for INR
  if (currencyCode === 'INR') {
    if (value >= 10000000) return `${symbol}${(value / 10000000).toFixed(2)}Cr`
    if (value >= 100000) return `${symbol}${(value / 100000).toFixed(2)}L`
  } else {
    // Standard Million notation for USD and others
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`
  }
  
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`
  return `${symbol}${value.toFixed(0)}`
}

export function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toFixed(0)
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

export function formatROAS(value: number) {
  return `${value.toFixed(2)}x`
}

// Campaign type detection
export function detectCampaignType(campaignName: string): string {
  const name = campaignName.toLowerCase()
  if (name.includes('tof')) return 'TOF'
  if (name.includes('mof')) return 'MOF'
  if (name.includes('bof') || name.includes('remarketing')) return 'BOF'
  if (name.includes('asc') || name.includes('adv+') || name.includes('advantage+')) return 'ADV+'
  return 'Other'
}

// Creative type detection
export function detectCreativeType(adName: string): string {
  const name = adName.toLowerCase()
  if (name.includes('catalog') || name.includes('dpa') || name.includes('dynamic')) return 'Catalog'
  if (name.includes('reel') || name.includes('video') || name.includes('_rv_') || name.includes('_vd_')) return 'Reel'
  if (name.includes('carousel')) return 'Carousel'
  if (name.includes('static') || name.includes('_si_') || name.includes('_st_')) return 'Static'
  return 'Other'
}

// Reel sub-type detection
export function detectReelSubType(adName: string): string {
  const name = adName.toLowerCase()
  if (name.includes('partnership') || name.includes('collab')) return 'Partnership Reel'
  if (name.includes('ugc') || name.includes('_im_')) return 'UGC Reel'
  if (name.includes('brand')) return 'Brand Reel'
  return 'Organic Reel'
}

// Static sub-type detection
export function detectStaticSubType(adName: string): string {
  const name = adName.toLowerCase()
  if (name.includes('partnership') || name.includes('collab')) return 'Partnership Static'
  if (name.includes('ugc') || name.includes('_im_')) return 'UGC Static'
  if (name.includes('ai') || name.includes('cs_ai')) return 'AI Static'
  if (name.includes('brand')) return 'Brand Static'
  return 'Standard Static'
}

// Carousel sub-type detection
export function detectCarouselSubType(adName: string): string {
  const name = adName.toLowerCase()
  if (name.includes('product')) return 'Product Carousel'
  if (name.includes('brand')) return 'Brand Carousel'
  return 'Standard Carousel'
}

export const CAMPAIGN_TYPE_COLORS: Record<string, string> = {
  TOF: '#4D9EFF',
  MOF: '#FFB800',
  BOF: '#FF4D4D',
  'ADV+': '#A78BFA',
  Other: '#6B7280',
}

export type Threshold = {
  operator: string
  value?: number
  min?: number
  max?: number
  color: string
}

export const DEFAULT_ROAS_THRESHOLDS: Threshold[] = [
  { operator: 'gt', value: 3, color: '#00C48C' },
  { operator: 'between', min: 2, max: 3, color: '#FFB800' },
  { operator: 'lt', value: 2, color: '#FF4D4D' },
]

export const DEFAULT_CPP_THRESHOLDS: Threshold[] = [
  { operator: 'lt', value: 300, color: '#00C48C' },
  { operator: 'between', min: 300, max: 500, color: '#FFB800' },
  { operator: 'gt', value: 500, color: '#FF4D4D' },
]

export function getMetricColor(
  metric: string,
  value: number,
  thresholds: Threshold[] = DEFAULT_ROAS_THRESHOLDS
): string {
  if (!value || isNaN(value)) return '#6B7280'
  for (const t of thresholds) {
    if (t.operator === 'gt' && t.value !== undefined && value > t.value) return t.color
    if (t.operator === 'lt' && t.value !== undefined && value < t.value) return t.color
    if (t.operator === 'between' && t.min !== undefined && t.max !== undefined
        && value >= t.min && value <= t.max) return t.color
  }
  return '#6B7280'
}

// Date range helpers
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_14d'
  | 'last_30d'
  | 'this_month'
  | 'last_90d'
  | 'last_180d'
  | 'custom'

export function getDatePresetLabel(preset: DatePreset, customStart?: Date, customEnd?: Date): string {
  const today = new Date()
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  switch (preset) {
    case 'today':
      return `Today (${fmt(today)})`
    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return `Yesterday (${fmt(y)})`
    }
    case 'last_7d':
      return 'Last 7 Days'
    case 'last_14d':
      return 'Last 14 Days'
    case 'last_30d':
      return 'Last 30 Days'
    case 'this_month':
      return 'Month to Date'
    case 'last_90d':
      return 'Last 90 Days'
    case 'last_180d':
      return 'Last 180 Days'
    case 'custom':
      if (customStart && customEnd)
        return `${fmt(customStart)} – ${fmt(customEnd)}`
      return 'Custom'
    default:
      return preset
  }
}

export function getDateRange(preset: DatePreset): { start: string; end: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { start: fmt(today), end: fmt(today) }
    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return { start: fmt(y), end: fmt(y) }
    }
    case 'last_7d': {
      const s = new Date(today)
      s.setDate(s.getDate() - 7)
      return { start: fmt(s), end: fmt(today) }
    }
    case 'last_14d': {
      const s = new Date(today)
      s.setDate(s.getDate() - 14)
      return { start: fmt(s), end: fmt(today) }
    }
    case 'last_30d': {
      const s = new Date(today)
      s.setDate(s.getDate() - 30)
      return { start: fmt(s), end: fmt(today) }
    }
    case 'this_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: fmt(s), end: fmt(today) }
    }
    case 'last_90d': {
      const s = new Date(today)
      s.setDate(s.getDate() - 90)
      return { start: fmt(s), end: fmt(today) }
    }
    case 'last_180d': {
      const s = new Date(today)
      s.setDate(s.getDate() - 180)
      return { start: fmt(s), end: fmt(today) }
    }
    default:
      return { start: fmt(today), end: fmt(today) }
  }
}

export function getMetaDatePreset(preset: DatePreset): string {
  const map: Record<string, string> = {
    today: 'today',
    yesterday: 'yesterday',
    last_7d: 'last_7d',
    last_14d: 'last_14d',
    last_30d: 'last_30d',
    this_month: 'this_month',
    last_90d: 'last_90d',
    last_180d: 'last_180d',
  }
  return map[preset] || 'today'
}
