import "server-only"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { connection } from "next/server"

import { serverEnv } from "@/lib/env/server"
import type { Database } from "@/lib/supabase/database.types"

/*
 * Supabase is only ever called from the server: the browser talks to
 * AniRadar, never to Supabase directly (PLAN.md §9).
 */

/** Supabase settings, or null when accounts aren't configured. */
export function supabaseConfig() {
  const url = serverEnv.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secretKey = serverEnv.SUPABASE_SECRET_KEY
  if (!url || !publishableKey || !secretKey) return null
  return { url, publishableKey, secretKey }
}

export function accountsEnabled(): boolean {
  return supabaseConfig() !== null
}

function requireConfig() {
  const config = supabaseConfig()
  if (!config) throw new Error("Accounts aren't configured (see .env.example)")
  return config
}

/**
 * A client acting as the signed-in user (row-level security applies),
 * with the session in cookies. Server components can't set cookies, so
 * session refreshes there are left to proxy.ts.
 */
export async function createUserClient() {
  const { url, publishableKey } = requireConfig()
  // The Supabase client reads the clock as soon as it starts, which isn't
  // allowed while prerendering: this marks the caller as per-request.
  await connection()
  const cookieStore = await cookies()
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a server component; proxy.ts refreshes the session.
        }
      },
    },
  })
}

/**
 * A client with the secret key: bypasses row-level security. Only for the
 * few server tasks that need it (AniList tokens, account deletion).
 */
export function createAdminClient() {
  const { url, secretKey } = requireConfig()
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
