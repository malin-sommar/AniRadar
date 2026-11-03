import { NextResponse, type NextRequest } from "next/server"

import { clientEnv } from "@/lib/env/client"
import { accountsEnabled, createUserClient } from "@/server/supabase"

/**
 * Where Google and Discord return to: swaps the one-time code for a
 * session (PKCE) and goes to the settings page. (Email links use
 * /auth/confirm instead, which works in any browser.)
 */
export async function GET(request: NextRequest) {
  const site = clientEnv.NEXT_PUBLIC_SITE_URL
  const code = request.nextUrl.searchParams.get("code")
  if (!code || !accountsEnabled()) {
    return NextResponse.redirect(new URL("/login?error=callback", site))
  }

  const supabase = await createUserClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.warn("[auth] Sign-in callback failed:", error.message)
    return NextResponse.redirect(new URL("/login?error=callback", site))
  }
  return NextResponse.redirect(new URL("/me", site))
}
