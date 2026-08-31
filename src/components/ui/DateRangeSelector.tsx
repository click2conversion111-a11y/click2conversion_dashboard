'use client'
import { useState, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { getDatePresetLabel, type DatePreset } from '@/lib/utils'

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7d', label: 'Last 7D' },
  { value: 'last_14d', label: 'Last 14D' },
  { value: 'last_30d', label: 'Last 30D' },
  { value: 'this_month', label: 'MTD' },
  { value: 'last_90d', label: 'Last 90D' },
  { value: 'last_180d', label: 'Last 180D' },
  { value: 'custom', label: 'Custom' },
]

export default function DateRangeSelector() {
  const { datePreset, customStart, customEnd, setDatePreset } = useDashboardStore()
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [cStart, setCStart] = useState(customStart || '')
  const [cEnd, setCEnd] = useState(customEnd || '')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCStart(customStart || '')
    setCEnd(customEnd || '')
  }, [customStart, customEnd])

  const label = mounted ? getDatePresetLabel(
    datePreset,
    customStart ? new Date(customStart) : undefined,
    customEnd ? new Date(customEnd) : undefined
  ) : '...'

  const handleSelect = (preset: DatePreset) => {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    setDatePreset(preset)
    setOpen(false)
  }

  const handleCustomApply = () => {
    if (cStart && cEnd) {
      setDatePreset('custom', cStart, cEnd)
      setOpen(false)
      setShowCustom(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-white/5 transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
      >
        <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
        <span>{label}</span>
        <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowCustom(false) }} />
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-xl overflow-hidden min-w-[220px]"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {!showCustom ? (
              <div className="p-1">
                {PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => handleSelect(p.value)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors flex items-center justify-between"
                    style={{ color: datePreset === p.value ? 'var(--accent-blue)' : 'var(--text-primary)' }}
                  >
                    {p.label}
                    {datePreset === p.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Custom Range</p>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                  <input
                    type="date"
                    value={cStart}
                    onChange={e => setCStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>End Date</label>
                  <input
                    type="date"
                    value={cEnd}
                    onChange={e => setCEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm border hover:bg-white/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!cStart || !cEnd}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ background: 'var(--accent-blue)', color: '#fff' }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
