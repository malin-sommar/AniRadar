import { NextResponse, type NextRequest } from "next/server"

import { clientEnv } from "@/lib/env/client"
import { accountsEnabled, createUserClient } from "@/server/supabase"

/**
 * The link in the sign-in email. It carries a one-time token hash, so it
 * works in any browser (unlike the PKCE flow, which needs the browser that
 * asked for the email). The email template points here:
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
export async function GET(request: NextRequest) {
  const site = clientEnv.NEXT_PUBLIC_SITE_URL
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  if (!tokenHash || !accountsEnabled()) {
    return NextResponse.redirect(new URL("/login?error=link", site))
  }

  const supabase = await createUserClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  })
  if (error) {
    console.warn("[auth] Email link failed:", error.message)
    return NextResponse.redirect(new URL("/login?error=link", site))
  }
  return NextResponse.redirect(new URL("/me", site))
}
