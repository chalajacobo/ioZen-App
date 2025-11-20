import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './types'

/**
 * Creates a Supabase client for browser/client components.
 * Uses singleton pattern - multiple calls return the same instance.
 *
 * @example
 * ```typescript
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase...
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
