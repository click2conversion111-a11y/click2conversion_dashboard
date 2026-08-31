'use client'
import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'

export function BrandsLoader() {
  const loadBrands = useDashboardStore(s => s.loadBrands)
  const brandsLoaded = useDashboardStore(s => s.brandsLoaded)

  useEffect(() => {
    if (!brandsLoaded) loadBrands()
  }, [])

  return null
}
