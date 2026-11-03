import "server-only"

import type { User } from "@supabase/supabase-js"

import { accountsEnabled, createUserClient } from "./supabase"

/**
 * The signed-in user, verified with Supabase (never trusted from cookie
 * data alone), or null. Reading cookies makes the caller render per
 * request, so keep it inside a Suspense boundary.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!accountsEnabled()) return null
  const supabase = await createUserClient()
  const { data, error } = await supabase.auth.getUser()
  return error ? null : data.user
}
