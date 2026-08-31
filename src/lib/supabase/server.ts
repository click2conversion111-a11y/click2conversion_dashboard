import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const isConfigured = url.startsWith('http') && key.length > 0

  if (!isConfigured) {
    // Return a proxy or throw a more descriptive error that doesn't crash the lib
    // For server components, we'll return a minimal client that errors on call
    return createServerClient('https://mock.supabase.co', 'mock-key', {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    })
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — ignore
        }
      },
    },
  })
}

