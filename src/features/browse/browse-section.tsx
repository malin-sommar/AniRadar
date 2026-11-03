import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { cacheLife, cacheTag } from "next/cache"
import { Suspense } from "react"

import { CardGridSkeleton } from "@/components/anime/anime-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FAILURE_CACHE_LIFE,
  cacheLifeProfile,
} from "@/lib/anilist/cache-policy"
import { aniListQueryKey } from "@/lib/anilist/query-keys"
import { cachePolicyFor } from "@/lib/anilist/registry"
import { getAniList } from "@/lib/anilist/server"
import { makeQueryClient } from "@/lib/query/query-client"

import { BrowseView } from "./browse-view"

/**
 * Prefetches the genre and tag lists (cached for 7 days) and hands them to
 * the client. The results themselves load in the browser, since they
 * depend on the URL and on this device's settings.
 */
export async function BrowseSection() {
  "use cache"
  const queryClient = makeQueryClient()
  let succeeded = true
  try {
    const data = await getAniList("GenresAndTags", {})
    queryClient.setQueryData(aniListQueryKey("GenresAndTags", {}), data)
  } catch (error) {
    succeeded = false
    console.warn("[browse] Couldn't prefetch genres and tags:", error)
  }
  cacheLife(
    succeeded
      ? cacheLifeProfile(cachePolicyFor("GenresAndTags"))
      : FAILURE_CACHE_LIFE,
  )
  cacheTag("anilist", "anilist:GenresAndTags")

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* The filters come from the URL, which is only known in the browser. */}
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseView />
      </Suspense>
    </HydrationBoundary>
  )
}

export function BrowseSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading browse">
      <Skeleton className="h-12 rounded-full" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <CardGridSkeleton count={12} />
    </div>
  )
}
