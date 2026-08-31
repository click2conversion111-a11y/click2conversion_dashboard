'use client'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  trend?: number // percent change vs previous period
  icon?: React.ReactNode
  color?: string
  prefix?: string
  suffix?: string
  delay?: number
  className?: string
}

export default function MetricCard({
  label,
  value,
  trend,
  icon,
  color,
  delay = 0,
  className,
}: MetricCardProps) {
  const trendUp = trend !== undefined && trend > 0
  const trendDown = trend !== undefined && trend < 0
  const trendFlat = trend !== undefined && trend === 0

  return (
    <div
      className={cn(
        'animate-card rounded-xl p-5 border flex flex-col gap-3 relative overflow-hidden',
        className
      )}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: color ? `${color}20` : 'var(--surface-2)', color: color || 'var(--text-secondary)' }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: color || 'var(--text-primary)' }}
        >
          {value}
        </span>

        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trendUp && 'bg-green-500/10 text-green-400',
              trendDown && 'bg-red-500/10 text-red-400',
              trendFlat && 'bg-gray-500/10 text-gray-400'
            )}
          >
            {trendUp && <TrendingUp size={12} />}
            {trendDown && <TrendingDown size={12} />}
            {trendFlat && <Minus size={12} />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
