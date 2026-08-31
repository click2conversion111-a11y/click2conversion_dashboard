'use client'
import { cn, CAMPAIGN_TYPE_COLORS, getMetricColor, DEFAULT_ROAS_THRESHOLDS, DEFAULT_CPP_THRESHOLDS, type Threshold } from '@/lib/utils'

interface ROASBadgeProps {
  value: number
  thresholds?: Threshold[]
  className?: string
}

export function ROASBadge({ value, thresholds = DEFAULT_ROAS_THRESHOLDS, className }: ROASBadgeProps) {
  const color = getMetricColor('roas', value, thresholds)
  if (!value || value === 0) return <span style={{ color: '#6B7280' }}>–</span>
  return (
    <span
      className={cn('font-bold text-sm', className)}
      style={{ color }}
    >
      {value.toFixed(2)}x
    </span>
  )
}

interface CPPBadgeProps {
  value: number
  thresholds?: Threshold[]
  className?: string
}

export function CPPBadge({ value, thresholds = DEFAULT_CPP_THRESHOLDS, className }: CPPBadgeProps) {
  const color = getMetricColor('cpp', value, thresholds)
  if (!value || value === 0) return <span style={{ color: '#6B7280' }}>–</span>
  return (
    <span
      className={cn('font-bold text-sm', className)}
      style={{ color }}
    >
      ₹{value.toFixed(0)}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status?.toUpperCase() === 'ACTIVE'
  const isPaused = status?.toUpperCase() === 'PAUSED'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        isActive && 'bg-green-500/10 text-green-400',
        isPaused && 'bg-yellow-500/10 text-yellow-400',
        !isActive && !isPaused && 'bg-gray-500/10 text-gray-400',
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: isActive ? '#00C48C' : isPaused ? '#FFB800' : '#6B7280',
        }}
      />
      {status || 'Unknown'}
    </span>
  )
}

interface CampaignTypeBadgeProps {
  type: string
  className?: string
}

export function CampaignTypeBadge({ type, className }: CampaignTypeBadgeProps) {
  const color = CAMPAIGN_TYPE_COLORS[type] || '#6B7280'
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        className
      )}
      style={{ background: `${color}20`, color }}
    >
      {type}
    </span>
  )
}

interface DiffBadgeProps {
  value: number
  prefix?: string
  suffix?: string
  positiveIsGood?: boolean
  className?: string
}

export function DiffBadge({ value, prefix = '', suffix = '', positiveIsGood = true, className }: DiffBadgeProps) {
  const isPositive = value > 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  const color = isGood ? '#00C48C' : value === 0 ? '#6B7280' : '#FF4D4D'
  const sign = isPositive ? '+' : ''
  return (
    <span className={cn('text-sm font-medium', className)} style={{ color }}>
      {sign}{prefix}{Math.abs(value).toFixed(2)}{suffix}
    </span>
  )
}
