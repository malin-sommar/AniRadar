import { Skeleton } from "@/components/ui/skeleton"
import {
  groupSeasons,
  walkSeasonChain,
  type SeasonItem,
} from "@/domain/seasons"
import { isPresent } from "@/domain/media"
import { getAniList } from "@/lib/anilist/server"

import { getAnimeDetail } from "./load"
import { SeasonsList } from "./seasons-list"

/**
 * Fetches the rest of the prequel/sequel chain (each batch cached for a
 * day) and lists the seasons in order. Streams in after the main content;
 * if AniList fails mid-walk, what was found so far is shown.
 */
export async function SeasonsSection({ id }: { id: number }) {
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

  const groups = groupSeasons(graph, id)
  if (
    groups.main.length <= 1 &&
    groups.side.length === 0 &&
    groups.source.length === 0
  ) {
    return null
  }
  return <SeasonsList currentId={id} groups={groups} incomplete={truncated} />
}

export function SeasonsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-7 w-48" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="w-28 shrink-0 space-y-2">
            <Skeleton className="aspect-[2/3] rounded-xl" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
