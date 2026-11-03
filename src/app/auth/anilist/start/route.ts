import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { clientEnv } from "@/lib/env/client"
import {
  STATE_COOKIE,
  STATE_MAX_AGE_SECONDS,
  anilistOAuthConfig,
  authorizeUrl,
  createState,
} from "@/server/anilist-account"
import { getCurrentUser } from "@/server/session"

/** Sends you to AniList to approve AniRadar (you must be signed in). */
export async function GET() {
  const site = clientEnv.NEXT_PUBLIC_SITE_URL
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL("/login", site))
  const config = anilistOAuthConfig()
  if (!config)
    return NextResponse.redirect(new URL("/me?anilist=unavailable", site))

  const { state, cookie } = createState(user.id)
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/anilist",
    maxAge: STATE_MAX_AGE_SECONDS,
  })
  return NextResponse.redirect(
    authorizeUrl(config.clientId, config.redirectUri, state),
  )
}
