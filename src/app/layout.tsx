import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'D2C Analytics Dashboard',
  description: 'Multi-brand D2C performance analytics',
}

import { AuthProvider } from '@/components/providers/AuthProvider'
import { BrandsLoader } from '@/components/providers/BrandsLoader'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#0F1117] text-[#F0F2FF] antialiased">
        <AuthProvider>
          <BrandsLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
