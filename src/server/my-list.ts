import "server-only"

import { isPresent } from "@/domain/media"
import type { ListEntry } from "@/domain/my-list"
import { groupIntoSeries } from "@/domain/series"
import type { Sequel } from "@/domain/smart-status"
import { streamingServices } from "@/domain/streaming"
import type { OperationData } from "@/lib/anilist/registry"
import { requestAniList } from "@/lib/anilist/server"

/** Big lists come in chunks of 500; this covers 5,000 entries. */
const MAX_CHUNKS = 10

type Collection = NonNullable<
  OperationData<"MyAnimeList">["MediaListCollection"]
>
type RawEntry = NonNullable<
  NonNullable<NonNullable<Collection["lists"]>[number]>["entries"]
>[number]
type RawMedia = NonNullable<NonNullable<RawEntry>["media"]>

/**
 * Your AniList anime list, read with your token (never cached on the
 * server), in the compact shape the list page needs. Series are grouped
 * here, where the relations are; the browser gets no relation data.
 */
export async function loadMyList(
  anilistUserId: number,
  token: string,
): Promise<ListEntry[]> {
  const raw: NonNullable<RawEntry>[] = []
  for (let chunk = 1; chunk <= MAX_CHUNKS; chunk++) {
    const data = await requestAniList(
      "MyAnimeList",
      { userId: anilistUserId, chunk },
      { token },
    )
    const collection = data.MediaListCollection
    for (const list of collection?.lists ?? []) {
      // Custom lists repeat entries from the status lists.
      if (!list || list.isCustomList) continue
      raw.push(...(list.entries ?? []).filter(isPresent))
    }
    if (!collection?.hasNextChunk) break
  }

  const media = raw.map((entry) => entry.media).filter(isPresent)
  const seriesOf = new Map<number, number>()
  for (const group of groupIntoSeries(media)) {
    for (const member of group.members) seriesOf.set(member.id, group.first.id)
  }

  const seen = new Set<number>()
  return raw
    .filter((entry) => entry.media && !seen.has(entry.id) && seen.add(entry.id))
    .map((entry) => toListEntry(entry, entry.media as RawMedia, seriesOf))
}

function toListEntry(
  entry: NonNullable<RawEntry>,
  media: RawMedia,
  seriesOf: ReadonlyMap<number, number>,
): ListEntry {
  const sequels: Sequel[] = (media.relations?.edges ?? [])
    .filter(
      (edge) => edge?.relationType === "SEQUEL" && edge.node?.type === "ANIME",
    )
    .map((edge) => edge?.node)
    .filter(isPresent)
    .map((node) => ({
      id: node.id,
      format: node.format,
      status: node.status,
      startDate: node.startDate,
      title: node.title,
    }))

  return {
    entryId: entry.id,
    mediaId: entry.mediaId,
    seriesId: seriesOf.get(media.id) ?? media.id,
    status: entry.status ?? "PLANNING",
    progress: entry.progress ?? 0,
    // AniList uses 0 for "no score".
    score: entry.score ? entry.score : null,
    repeat: entry.repeat ?? 0,
    updatedAt: entry.updatedAt ?? 0,
    media: {
      id: media.id,
      title: media.title,
      coverImage: media.coverImage,
      format: media.format,
      status: media.status,
      episodes: media.episodes,
      season: media.season,
      seasonYear: media.seasonYear,
      averageScore: media.averageScore,
      genres: media.genres,
      isAdult: media.isAdult,
      nextAiringEpisode: media.nextAiringEpisode,
      startDate: media.startDate,
    },
    sequels,
    services: streamingServices(media.externalLinks),
  }
}
