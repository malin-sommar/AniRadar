import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { cacheLife, cacheTag } from "next/cache"

import {
  FAILURE_CACHE_LIFE,
  cacheLifeProfile,
} from "@/lib/anilist/cache-policy"
import { aniListQueryKey } from "@/lib/anilist/query-keys"
import { cachePolicyFor } from "@/lib/anilist/registry"
import { getAniList } from "@/lib/anilist/server"
import { makeQueryClient } from "@/lib/query/query-client"

import { TrendingShowcase } from "./trending-showcase"
import { TRENDING_VARIABLES } from "./trending-variables"

/**
 * Fetches trending anime on the server and hands it to the client cache.
 * Cached as part of the prerendered page and refreshed every 30 minutes.
 * If AniList fails (also during a build), the section renders at request
 * time instead and the browser fetches the data itself.
 */
export async function TrendingSection() {
  "use cache"
  const queryClient = makeQueryClient()
  let succeeded = true
  try {
    const data = await getAniList("TrendingAnime", TRENDING_VARIABLES)
    queryClient.setQueryData(
      aniListQueryKey("TrendingAnime", TRENDING_VARIABLES),
      data,
    )
  } catch (error) {
    succeeded = false
    console.warn("[home] Couldn't prefetch trending anime:", error)
  }
  cacheLife(
    succeeded
      ? cacheLifeProfile(cachePolicyFor("TrendingAnime"))
      : FAILURE_CACHE_LIFE,
  )
  cacheTag("anilist", "anilist:TrendingAnime")

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrendingShowcase />
    </HydrationBoundary>
  )
}
