'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'

type Operator = 'gt' | 'lt' | 'between'

interface Threshold {
  operator: Operator
  value?: number
  min?: number
  max?: number
  color: string
}

interface MetricConfig {
  metricName: string
  thresholds: Threshold[]
}

const METRICS = ['roas', 'cpp', 'ctr', 'cpc', 'cpm']
const METRIC_LABELS: Record<string, string> = {
  roas: 'ROAS',
  cpp: 'Cost Per Purchase (CPP)',
  ctr: 'CTR',
  cpc: 'CPC',
  cpm: 'CPM',
}

const DEFAULT_CONFIGS: MetricConfig[] = [
  {
    metricName: 'roas',
    thresholds: [
      { operator: 'gt', value: 3, color: '#00C48C' },
      { operator: 'between', min: 2, max: 3, color: '#FFB800' },
      { operator: 'lt', value: 2, color: '#FF4D4D' },
    ],
  },
  {
    metricName: 'cpp',
    thresholds: [
      { operator: 'lt', value: 300, color: '#00C48C' },
      { operator: 'between', min: 300, max: 500, color: '#FFB800' },
      { operator: 'gt', value: 500, color: '#FF4D4D' },
    ],
  },
]

export default function FormattingPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.accountId as string
  const [configs, setConfigs] = useState<MetricConfig[]>(DEFAULT_CONFIGS)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/config/formatting?accountId=${accountId}`)
      .then(r => r.json())
      .then(j => {
        if (j.data && j.data.length > 0) {
          setConfigs(j.data.map((d: { metric_name: string; thresholds: Threshold[] }) => ({
            metricName: d.metric_name,
            thresholds: d.thresholds,
          })))
        }
      })
      .catch(() => {})
  }, [accountId])

  const getOrCreate = (metric: string): MetricConfig => {
    return configs.find(c => c.metricName === metric) || { metricName: metric, thresholds: [] }
  }

  const updateConfig = (metric: string, updated: MetricConfig) => {
    setConfigs(prev => {
      const filtered = prev.filter(c => c.metricName !== metric)
      return [...filtered, updated]
    })
  }

  const addThreshold = (metric: string) => {
    const config = getOrCreate(metric)
    updateConfig(metric, {
      ...config,
      thresholds: [...config.thresholds, { operator: 'gt', value: 0, color: '#00C48C' }],
    })
  }

  const removeThreshold = (metric: string, idx: number) => {
    const config = getOrCreate(metric)
    const thresholds = [...config.thresholds]
    thresholds.splice(idx, 1)
    updateConfig(metric, { ...config, thresholds })
  }

  const updateThreshold = (metric: string, idx: number, field: keyof Threshold, val: string | number) => {
    const config = getOrCreate(metric)
    const thresholds = [...config.thresholds]
    thresholds[idx] = { ...thresholds[idx], [field]: val }
    updateConfig(metric, { ...config, thresholds })
  }

  const saveMetric = async (metric: string) => {
    const config = getOrCreate(metric)
    setSaving(prev => ({ ...prev, [metric]: true }))
    try {
      const res = await fetch('/api/config/formatting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, metricName: metric, thresholds: config.thresholds }),
      })
      if (res.ok) {
        setSaved(prev => ({ ...prev, [metric]: true }))
        setTimeout(() => setSaved(prev => ({ ...prev, [metric]: false })), 2000)
      }
    } finally {
      setSaving(prev => ({ ...prev, [metric]: false }))
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <TopBar />
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Conditional Formatting</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Set color thresholds per metric for account {accountId}
            </p>
          </div>
        </div>

        {METRICS.map(metric => {
          const config = getOrCreate(metric)
          return (
            <div key={metric} className="rounded-xl border p-5 space-y-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{METRIC_LABELS[metric] || metric.toUpperCase()}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => addThreshold(metric)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs hover:bg-white/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <Plus size={12} /> Add threshold
                  </button>
                  <button
                    onClick={() => saveMetric(metric)}
                    disabled={saving[metric]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                    style={{ background: saved[metric] ? '#00C48C20' : 'var(--accent-blue)', color: saved[metric] ? '#00C48C' : '#fff' }}>
                    <Save size={12} />
                    {saving[metric] ? 'Saving...' : saved[metric] ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {config.thresholds.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: 'var(--surface-2)' }}>
                    <select
                      value={t.operator}
                      onChange={e => updateThreshold(metric, idx, 'operator', e.target.value)}
                      className="px-2 py-1.5 rounded border text-xs"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <option value="gt">Greater than</option>
                      <option value="lt">Less than</option>
                      <option value="between">Between</option>
                    </select>

                    {t.operator === 'between' ? (
                      <>
                        <input type="number" value={t.min || ''} placeholder="Min"
                          onChange={e => updateThreshold(metric, idx, 'min', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1.5 rounded border text-xs"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
                        <input type="number" value={t.max || ''} placeholder="Max"
                          onChange={e => updateThreshold(metric, idx, 'max', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1.5 rounded border text-xs"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                      </>
                    ) : (
                      <input type="number" value={t.value || ''} placeholder="Value"
                        onChange={e => updateThreshold(metric, idx, 'value', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1.5 rounded border text-xs"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                    )}

                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>

                    <div className="flex items-center gap-2">
                      <input type="color" value={t.color}
                        onChange={e => updateThreshold(metric, idx, 'color', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                        style={{ background: 'none' }} />
                      <span
                        className="w-6 h-6 rounded-full"
                        style={{ background: t.color }}
                      />
                    </div>

                    <button onClick={() => removeThreshold(metric, idx)}
                      className="ml-auto hover:text-red-400"
                      style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {config.thresholds.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No thresholds configured — using default colors
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
