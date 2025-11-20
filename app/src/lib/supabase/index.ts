// Re-export all Supabase utilities for convenient imports
export { createClient } from './client'
export { createClient as createServerClient, getUser, requireAuth } from './server'
export { updateSession } from './middleware'
export type { Database, Json } from './types'
