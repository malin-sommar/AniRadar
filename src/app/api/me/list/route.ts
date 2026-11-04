import type { MyListResponse } from "@/features/list/types"
import { isAniListError } from "@/lib/anilist/core/errors"
import {
  getAniListAccess,
  isUnauthorized,
  markConnectionExpired,
} from "@/server/anilist-user"
import { loadMyList } from "@/server/my-list"
import { getCurrentUser } from "@/server/session"
import { createUserClient } from "@/server/supabase"

/** Your list is yours alone: never in a shared or browser HTTP cache. */
const PRIVATE = { "Cache-Control": "private, no-store" }

function answer(body: MyListResponse, status = 200) {
  return Response.json(body, { status, headers: PRIVATE })
}

/** Your AniList anime list, grouped into series (see loadMyList). */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return answer({ status: "signed-out" }, 401)

  const access = await getAniListAccess(user)
  if (!access.ok) return answer({ status: access.reason })

  try {
    const supabase = await createUserClient()
    const [entries, { data: profile }] = await Promise.all([
      loadMyList(access.anilistUserId, access.token),
      supabase
        .from("profiles")
        .select("my_services")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])
    return answer({
      status: "ok",
      entries,
      myServices: profile?.my_services ?? [],
      fetchedAt: Date.now(),
    })
  } catch (error) {
    if (isUnauthorized(error)) {
      await markConnectionExpired(user.id)
      return answer({ status: "expired" })
    }
    console.warn("[api/me/list] Couldn't load the list:", error)
    const retryAfterMs = isAniListError(error) ? error.retryAfterMs : undefined
    return answer(
      {
        status: "busy",
        retryAfterSeconds: retryAfterMs
          ? Math.ceil(retryAfterMs / 1000)
          : undefined,
      },
      503,
    )
  }
}
