import { NextResponse, type NextRequest } from "next/server"

import { clientEnv } from "@/lib/env/client"
import { accountsEnabled, createUserClient } from "@/server/supabase"

const PROVIDERS = ["google", "discord"] as const
type Provider = (typeof PROVIDERS)[number]

function isProvider(value: string): value is Provider {
  return (PROVIDERS as readonly string[]).includes(value)
}

/**
 * Starts Google or Discord sign-in. A plain link (not a form), so the
 * redirect to the provider isn't held back by the CSP's form-action rule.
 * The PKCE verifier goes into a cookie; /auth/callback finishes the job.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/auth/signin/[provider]">,
) {
  const { provider } = await ctx.params
  const site = clientEnv.NEXT_PUBLIC_SITE_URL
  if (!isProvider(provider) || !accountsEnabled()) {
    return NextResponse.redirect(new URL("/login?error=provider", site))
  }

  const supabase = await createUserClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${site}/auth/callback`,
      skipBrowserRedirect: true,
      // Only who you are: no access to your Google or Discord data.
      scopes: provider === "discord" ? "identify email" : undefined,
    },
  })
  if (error || !data.url) {
    console.warn(`[auth] Couldn't start ${provider} sign-in:`, error?.message)
    return NextResponse.redirect(new URL("/login?error=provider", site))
  }
  return NextResponse.redirect(data.url)
}
