'use client'
import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getMetricColor, DEFAULT_ROAS_THRESHOLDS, DEFAULT_CPP_THRESHOLDS, type Threshold } from '@/lib/utils'

interface Props {
  metric: 'roas' | 'cpp' | 'ctr' | 'cpc' | 'cpm'
  value: number
  accountId?: string
  format?: (v: number) => string
  className?: string
  currencyCode?: string
}

const defaultThresholds: Record<string, Threshold[]> = {
  roas: DEFAULT_ROAS_THRESHOLDS,
  cpp: DEFAULT_CPP_THRESHOLDS,
  ctr: [
    { operator: 'gt', value: 2, color: '#00C48C' },
    { operator: 'between', min: 1, max: 2, color: '#FFB800' },
    { operator: 'lt', value: 1, color: '#FF4D4D' },
  ],
}

const formattingCache: Record<string, Record<string, Threshold[]>> = {}

export default function ConditionalFormatter({ metric, value, accountId, format, className }: Props) {
  const [thresholds, setThresholds] = useState<Threshold[]>(defaultThresholds[metric] || [])

  useEffect(() => {
    if (!accountId) return
    const cacheKey = accountId
    if (formattingCache[cacheKey]?.[metric]) {
      setThresholds(formattingCache[cacheKey][metric])
      return
    }
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    supabase
      .from('metric_formatting')
      .select('thresholds')
      .eq('account_id', accountId)
      .eq('metric_name', metric)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.thresholds) {
          if (!formattingCache[cacheKey]) formattingCache[cacheKey] = {}
          formattingCache[cacheKey][metric] = data.thresholds
          setThresholds(data.thresholds)
        }
      })
  }, [accountId, metric])

  const color = getMetricColor(metric, value, thresholds)
  const display = format ? format(value) : value.toFixed(2)

  if (!value || value === 0) return <span style={{ color: '#6B7280' }} className={className}>–</span>

  return (
    <span className={`font-semibold ${className}`} style={{ color }}>
      {display}
    </span>
  )
}
