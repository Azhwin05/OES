import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

/**
 * Service-role Supabase client. SERVER ONLY — bypasses RLS.
 * The `server-only` import guarantees this never ends up in a browser bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase service role configuration (SUPABASE_SERVICE_ROLE_KEY)."
    )
  }

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
