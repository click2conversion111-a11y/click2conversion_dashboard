'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, ChevronDown as Expand } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Column<T = any> = {
  key: keyof T | string
  header: string
  sortable?: boolean
  render?: (value: unknown, row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

interface SortableTableProps<T extends Record<string, any>> {
  columns: Column<any>[]
  data: T[]
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  onRowClick?: (row: T) => void
  expandedRowRender?: (row: T) => ReactNode
  keyField?: keyof T
  loading?: boolean
  emptyMessage?: string
  className?: string
  pageSize?: number
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export default function SortableTable<T extends Record<string, any>>({
  columns,
  data,
  defaultSort,
  onRowClick,
  expandedRowRender,
  keyField = 'id' as keyof T,
  loading = false,
  emptyMessage = 'No data found',
  className,
  pageSize = 50,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>(defaultSort?.key || '')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.dir || 'desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === undefined || av === null) return 1
      if (bv === undefined || bv === null) return -1
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getValue = (row: T, key: string): unknown => {
    const parts = key.split('.')
    let val: unknown = row
    for (const part of parts) {
      if (val === null || val === undefined) return undefined
      val = (val as Record<string, unknown>)[part]
    }
    return val
  }

  return (
    <div
      className={cn('rounded-xl border overflow-hidden', className)}
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              {expandedRowRender && <th className="w-8" />}
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left font-medium whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-white',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      (sortKey === String(col.key) ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length + (expandedRowRender ? 1 : 0)} />
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (expandedRowRender ? 1 : 0)}
                  className="px-4 py-12 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const rowId = String(row[keyField as string] ?? idx)
                const isExpanded = expandedRows.has(rowId)
                return [
                  <tr
                    key={rowId}
                    className={cn(
                      'border-b transition-colors',
                      (onRowClick || expandedRowRender) && 'cursor-pointer hover:bg-white/[0.02]'
                    )}
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => {
                      if (expandedRowRender) toggleRow(rowId)
                      else onRowClick?.(row)
                    }}
                  >
                    {expandedRowRender && (
                      <td className="px-3 py-3 w-8">
                        <span style={{ color: 'var(--text-muted)' }}>
                          {isExpanded ? <Expand size={14} /> : <ChevronRight size={14} />}
                        </span>
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'px-4 py-3 whitespace-nowrap',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(getValue(row, String(col.key)), row)
                          : String(getValue(row, String(col.key)) ?? '–')}
                      </td>
                    ))}
                  </tr>,
                  isExpanded && expandedRowRender && (
                    <tr key={`${rowId}-expand`} style={{ background: 'var(--surface-2)' }}>
                      <td colSpan={columns.length + 1} className="p-0">
                        {expandedRowRender(row)}
                      </td>
                    </tr>
                  ),
                ]
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-4 py-3 border-t text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded border disabled:opacity-30 hover:bg-white/5"
              style={{ borderColor: 'var(--border)' }}
            >
              Prev
            </button>
            <span style={{ color: 'var(--text-primary)' }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded border disabled:opacity-30 hover:bg-white/5"
              style={{ borderColor: 'var(--border)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
