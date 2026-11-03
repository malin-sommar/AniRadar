import { cache } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { isPresent } from "@/domain/media"
import {
  groupSeasons,
  walkSeasonChain,
  type SeasonItem,
} from "@/domain/seasons"
import { getAniList } from "@/lib/anilist/server"

import { getAnimeDetail } from "./load"
import { RelatedList, SeriesOverview } from "./seasons-list"

/**
 * Walks the rest of the prequel/sequel chain (each batch cached for a day)
 * and groups the entries. Shared by both sections within one request. If
 * AniList fails mid-walk, what was found so far is used.
 */
const loadSeasonGroups = cache(async (id: number) => {
  const media = await getAnimeDetail(id).catch(() => null)
  if (!media) return null
  const { graph, truncated } = await walkSeasonChain(media, async (ids) => {
    // Sorted, so the same batch always hits the same cache entry.
    const data = await getAniList("SeasonChain", {
      ids: [...ids].sort((a, b) => a - b),
    }).catch((error: unknown) => {
      console.warn(`[anime/${id}] Season chain incomplete:`, error)
      throw error
    })
    return (data.Page?.media ?? []).filter(isPresent) as SeasonItem[]
  })
  return { groups: groupSeasons(graph, id), incomplete: truncated }
})

/** The series' seasons, right under the hero. Left out for one-off entries. */
export async function SeriesSection({ id }: { id: number }) {
  const result = await loadSeasonGroups(id)
  if (!result || result.groups.main.length <= 1) return null
  return (
    <SeriesOverview
      currentId={id}
      main={result.groups.main}
      incomplete={result.incomplete}
    />
  )
}

/** Side stories, specials, spin-offs and source material, further down. */
export async function RelatedSection({ id }: { id: number }) {
  const result = await loadSeasonGroups(id)
  if (!result) return null
  return (
    <RelatedList
      currentId={id}
      side={result.groups.side}
      source={result.groups.source}
    />
  )
}

export function SeasonsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="w-32 shrink-0 space-y-2 sm:w-36">
            <Skeleton className="aspect-[2/3] rounded-xl" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
