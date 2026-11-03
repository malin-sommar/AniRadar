import type { NextRequest } from "next/server"
import { z } from "zod"

import { CACHE_POLICIES, cdnCacheControl } from "@/lib/anilist/cache-policy"
import { getTitleMatches } from "@/lib/kitsu/server"

/**
 * AniList IDs of shows whose titles match `?q=`, partial words included.
 * Search uses these next to AniList's own whole-word search. If the lookup
 * fails the answer is an empty list, so search still works without it.
 */

const querySchema = z.string().trim().min(2).max(100)

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q"))
  if (!parsed.success) {
    return Response.json(
      { ids: [], error: "q must be 2 to 100 characters" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const ids = await getTitleMatches(parsed.data)
    return Response.json(
      { ids },
      {
        headers: {
          "Cache-Control": cdnCacheControl(CACHE_POLICIES.browse),
        },
      },
    )
  } catch (error) {
    console.warn("[api/title-matches] Kitsu lookup failed:", error)
    return Response.json(
      { ids: [] },
      { headers: { "Cache-Control": "no-store" } },
    )
  }
}
