import "server-only"

import { isAniListError } from "@/lib/anilist/core/errors"
import type { OperationData } from "@/lib/anilist/registry"
import { getAniList } from "@/lib/anilist/server"

export type AnimeDetail = NonNullable<OperationData<"AnimeDetail">["Media"]>

/**
 * The detail page's main content (one cached AniList call, shared by the
 * page, its metadata, the MAL chip and the season chain). `null` when
 * AniList has no such anime; throws when AniList can't answer.
 */
export async function getAnimeDetail(id: number): Promise<AnimeDetail | null> {
  try {
    const data = await getAniList("AnimeDetail", { id })
    return data.Media ?? null
  } catch (error) {
    if (isAniListError(error) && error.notFound) return null
    throw error
  }
}
