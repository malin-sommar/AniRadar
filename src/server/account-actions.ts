"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { disconnectAniList } from "./anilist-account"
import { getCurrentUser } from "./session"
import { createAdminClient, createUserClient } from "./supabase"

/** Your session must be this fresh to delete your account. */
const RECENT_SIGN_IN_MS = 24 * 60 * 60 * 1000

/** Removes the AniList token and connection. */
export async function disconnectAniListAction() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  await disconnectAniList(user.id)
  redirect("/me?anilist=disconnected")
}

const preferencesSchema = z
  .object({
    titleLanguage: z.enum(["english", "romaji", "native"]),
    showAdult: z.boolean(),
  })
  .partial()

/** Saves display settings to your profile (row-level security applies). */
export async function savePreferences(input: unknown): Promise<boolean> {
  const parsed = preferencesSchema.safeParse(input)
  const user = await getCurrentUser()
  if (!parsed.success || !user) return false
  const supabase = await createUserClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      title_language: parsed.data.titleLanguage,
      show_adult: parsed.data.showAdult,
    })
    .eq("user_id", user.id)
  return !error
}

const servicesSchema = z.array(z.string().trim().min(1).max(40)).max(30)

/** Saves your streaming services (for the list's "On my services"). */
export async function saveMyServices(input: unknown): Promise<boolean> {
  const parsed = servicesSchema.safeParse(input)
  const user = await getCurrentUser()
  if (!parsed.success || !user) return false
  const supabase = await createUserClient()
  const { error } = await supabase
    .from("profiles")
    .update({ my_services: [...new Set(parsed.data)] })
    .eq("user_id", user.id)
  return !error
}

export type DeleteState =
  { status: "idle" | "deleted" } | { status: "error"; message: string }

/**
 * Deletes the account: the auth user goes, and every row goes with it
 * (ON DELETE CASCADE). Needs "DELETE" typed and a recent sign-in.
 */
export async function deleteAccount(
  _previous: DeleteState,
  form: FormData,
): Promise<DeleteState> {
  if (form.get("confirm") !== "DELETE") {
    return { status: "error", message: "Type DELETE to confirm." }
  }
  const user = await getCurrentUser()
  if (!user) return { status: "error", message: "You're not signed in." }
  const lastSignIn = Date.parse(user.last_sign_in_at ?? "")
  if (!(Date.now() - lastSignIn < RECENT_SIGN_IN_MS)) {
    return {
      status: "error",
      message: "For safety, sign out and sign in again first, then delete.",
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.warn("[account] Couldn't delete the account:", error.message)
    return {
      status: "error",
      message: "Couldn't delete the account. Try again.",
    }
  }
  const supabase = await createUserClient()
  await supabase.auth.signOut({ scope: "local" })
  return { status: "deleted" }
}
