import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Keeps the Supabase session fresh on the routes that use it, by refreshing
 * the access token and writing the new cookies to the response. Other
 * routes (browse, detail pages, the AniList proxy) never touch the session
 * and stay cacheable.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })
  // Refreshes the session if it has expired. Must run before any rendering.
  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ["/me/:path*", "/login", "/auth/:path*", "/api/me/:path*"],
}
