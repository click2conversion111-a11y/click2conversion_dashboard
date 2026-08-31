'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'

const PRESET_COLORS = [
  '#4D9EFF', '#A78BFA', '#00C48C', '#FFB800',
  '#FF4D4D', '#F97316', '#EC4899', '#14B8A6',
]

interface Props {
  onClose: () => void
  onCreated: (brandId: string) => void
}

export default function CreateBrandModal({ onClose, onCreated }: Props) {
  const { createBrand } = useDashboardStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const handleCreate = () => {
    if (!name.trim()) return
    const brand = createBrand(name.trim(), color)
    onCreated(brand.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm">New Brand</h2>
          <button onClick={onClose} className="hover:text-white" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: color }}
            >
              {name ? name[0].toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {name || 'Brand name'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>New brand</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Brand Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Havvok, OREK, Antrang..."
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Brand Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
              {/* Custom color */}
              <div className="relative w-7 h-7">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center text-xs"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  +
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity"
            style={{ background: color, color: '#fff' }}
          >
            Create Brand →
          </button>
        </div>
      </div>
    </div>
  )
}
