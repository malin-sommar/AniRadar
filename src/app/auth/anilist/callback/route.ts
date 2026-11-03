import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

import { clientEnv } from "@/lib/env/client"
import {
  STATE_COOKIE,
  checkState,
  connectAniList,
} from "@/server/anilist-account"
import { getCurrentUser } from "@/server/session"

/**
 * AniList sends you back here with a one-time code. The state cookie must
 * match, and you must still be the same signed-in user.
 */
export async function GET(request: NextRequest) {
  const site = clientEnv.NEXT_PUBLIC_SITE_URL
  const params = request.nextUrl.searchParams
  const back = (result: string) =>
    NextResponse.redirect(new URL(`/me?anilist=${result}`, site))

  const cookieStore = await cookies()
  const stateCookie = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete({ name: STATE_COOKIE, path: "/auth/anilist" })

  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL("/login", site))
  if (params.get("error")) return back("denied")
  const code = params.get("code")
  if (!code || !checkState(stateCookie, params.get("state"), user.id)) {
    return back("expired")
  }

  const result = await connectAniList(user.id, code)
  return back(result.ok ? "connected" : result.reason)
}
