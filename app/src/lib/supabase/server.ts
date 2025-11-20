import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './types'

/**
 * Creates a Supabase client for server components and route handlers.
 * Must be called fresh for each request to access request-specific cookies.
 *
 * IMPORTANT: Always use getUser() instead of getSession() on the server
 * to properly validate the JWT signature.
 *
 * @example
 * ```typescript
 * // In a server component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // Use user...
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // The `setAll` method is called from Server Components.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}

/**
 * Gets the current authenticated user from the server.
 * This is a convenience wrapper that validates the JWT.
 *
 * @returns The user object or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Requires authentication - throws redirect if not authenticated.
 * Use in server components/actions that require auth.
 *
 * @throws Redirects to /login if not authenticated
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  return user
}
