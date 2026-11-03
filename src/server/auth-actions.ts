"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { clientEnv } from "@/lib/env/client"

import { accountsEnabled, createUserClient } from "./supabase"

/*
 * Sign-in runs on the server, so the browser only ever talks to AniRadar.
 * Next.js checks the Origin header of server actions (CSRF).
 */

export type EmailStep =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string }

const emailSchema = z.email().max(254)
/** Supabase sends 6 to 10 digits, depending on the project's setting. */
const codeSchema = z.string().regex(/^\d{6,10}$/)

/** Step 1: email a sign-in link and a code. */
export async function sendEmailCode(
  _previous: EmailStep,
  form: FormData,
): Promise<EmailStep> {
  if (!accountsEnabled()) {
    return { step: "email", error: "Sign-in isn't set up on this server." }
  }
  const email = emailSchema.safeParse(String(form.get("email") ?? "").trim())
  if (!email.success) {
    return { step: "email", error: "That doesn't look like an email address." }
  }
  const supabase = await createUserClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) {
    console.warn("[auth] Couldn't send the sign-in email:", error.message)
    return {
      step: "email",
      error:
        error.status === 429
          ? "Too many emails were sent. Wait a few minutes and try again."
          : "Couldn't send the email. Try again in a moment.",
    }
  }
  return { step: "code", email: email.data }
}

/** Step 2: sign in with the code from the email. */
export async function verifyEmailCode(
  _previous: EmailStep,
  form: FormData,
): Promise<EmailStep> {
  const email = emailSchema.safeParse(String(form.get("email") ?? ""))
  const code = codeSchema.safeParse(
    String(form.get("code") ?? "").replace(/\s/g, ""),
  )
  if (!email.success) return { step: "email" }
  if (!code.success) {
    return {
      step: "code",
      email: email.data,
      error: "The code is the number in the email (6 to 10 digits).",
    }
  }
  const supabase = await createUserClient()
  const { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: code.data,
    type: "email",
  })
  if (error) {
    return {
      step: "code",
      email: email.data,
      error: "That code didn't work. It may have expired: ask for a new one.",
    }
  }
  redirect("/me")
}

/** Signs out here, or on every device. */
export async function signOut(form: FormData) {
  if (accountsEnabled()) {
    const supabase = await createUserClient()
    const everywhere = form.get("scope") === "global"
    await supabase.auth.signOut({ scope: everywhere ? "global" : "local" })
  }
  redirect("/me")
}
