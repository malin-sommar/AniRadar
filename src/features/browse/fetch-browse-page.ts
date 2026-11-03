import { z } from "zod"

import { matchSort, mergeSearchResults } from "@/domain/browse"
import { isPresent } from "@/domain/media"
import { fetchAniList } from "@/lib/anilist/browser"
import { CACHE_POLICIES } from "@/lib/anilist/cache-policy"
import type { OperationData, OperationVariables } from "@/lib/anilist/registry"
import { normalizeSearchText } from "@/lib/kitsu/title-matches"
import { getQueryClient } from "@/lib/query/query-client"

export type BrowseVariables = Omit<OperationVariables<"BrowseAnime">, "page">

/** A browse or search result: card fields plus series links. */
export type BrowseMedia = NonNullable<
  NonNullable<
    NonNullable<OperationData<"BrowseAnime">["Page"]>["media"]
  >[number]
>

export interface BrowsePage {
  media: BrowseMedia[]
  hasNextPage: boolean
  currentPage: number
}

/** Shortest search text worth a partial-word lookup. */
export const MIN_LOOKUP_LENGTH = 2

const titleMatchesSchema = z.object({ ids: z.array(z.int().min(1)) })

/**
 * AniList IDs whose titles match the text, partial words included (see
 * /api/title-matches). Cached like browse results. Never throws: without
 * matches, search falls back to AniList's whole-word search.
 */
function fetchTitleMatches(search: string): Promise<number[]> {
  const text = normalizeSearchText(search)
  if (text.length < MIN_LOOKUP_LENGTH) return Promise.resolve([])
  return getQueryClient().fetchQuery({
    queryKey: ["title-matches", text],
    queryFn: async ({ signal }) => {
      try {
        const response = await fetch(
          `/api/title-matches?${new URLSearchParams({ q: text })}`,
          { headers: { Accept: "application/json" }, signal },
        )
        if (!response.ok) return []
        return titleMatchesSchema.parse(await response.json()).ids
      } catch {
        return []
      }
    },
    staleTime: CACHE_POLICIES.browse.freshSeconds * 1000,
  })
}

/**
 * One page of browse results. The first page of a text search also
 * includes shows whose titles only match partly ("juju" → "Jujutsu
 * Kaisen"), which AniList's own search misses.
 */
export async function fetchBrowsePage(
  variables: BrowseVariables,
  page: number,
  signal?: AbortSignal,
): Promise<BrowsePage> {
  const search = variables.search ?? undefined
  if (page === 1 && search) {
    const ids = await fetchTitleMatches(search)
    if (ids.length > 0) {
      const sort = [variables.sort ?? []].flat().filter(isPresent)
      const data = await fetchAniList(
        "SearchAnime",
        { ...variables, search, ids, matchSort: matchSort(sort), page },
        { signal },
      )
      return {
        media: mergeSearchResults({
          ranking: ids,
          matches: (data.matches?.media ?? []).filter(isPresent),
          results: (data.Page?.media ?? []).filter(isPresent),
          byRelevance: sort.includes("SEARCH_MATCH"),
        }),
        hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
        currentPage: page,
      }
    }
  }

  const data = await fetchAniList(
    "BrowseAnime",
    { ...variables, page },
    { signal },
  )
  return {
    media: (data.Page?.media ?? []).filter(isPresent),
    hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
    currentPage: data.Page?.pageInfo?.currentPage ?? page,
  }
}
