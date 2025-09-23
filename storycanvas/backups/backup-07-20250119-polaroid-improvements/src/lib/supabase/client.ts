// Supabase client configuration for browser
// This handles our authentication and database connections

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Create a Supabase client configured for client-side use
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}