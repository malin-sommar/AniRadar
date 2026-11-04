import type {
  MediaFormat,
  MediaListStatus,
  MediaStatus,
} from "@/lib/anilist/gql/graphql"

import type { MediaTitleFields } from "./media"

/*
 * Smart status (PLAN.md §10.3): what a list entry really means right now.
 * A pure function of the entry, its media, its sequels, the rest of your
 * list and the current time. Nothing here is written to AniList.
 */

export type DisplayStatus =
  "watching" | "awaiting" | "planning" | "completed" | "paused" | "dropped"

export interface Sequel {
  id: number
  format: MediaFormat | null
  status: MediaStatus | null
  startDate: { year: number | null; month: number | null } | null
  title: MediaTitleFields | null
}

export interface SmartEntry {
  mediaId: number
  status: MediaListStatus
  progress: number
  media: {
    status: MediaStatus | null
    episodes: number | null
    nextAiringEpisode: { airingAt: number; episode: number } | null
  }
  /** Direct sequels (SEQUEL relations to anime). */
  sequels: Sequel[]
}

export type SmartReason =
  /** Caught up: the next episode hasn't aired yet. */
  | { kind: "episode"; episode: number; airingAt: number }
  /** Completed, and a sequel is announced but hasn't started. */
  | { kind: "sequel"; sequel: Sequel }
  /** Completed, and a sequel you haven't started is out. */
  | { kind: "sequel-out"; sequel: Sequel }

export interface SmartStatus {
  display: DisplayStatus
  rewatching: boolean
  reason?: SmartReason
  /** The last episode of a finished show is watched: becomes Completed (Phase 4b writes it). */
  autoComplete?: boolean
}

const SEQUEL_FORMATS: ReadonlySet<MediaFormat | null> = new Set([
  "TV",
  "TV_SHORT",
  "ONA",
  "MOVIE",
])

/** Episodes aired so far, or null when that isn't known. */
export function airedEpisodes(
  media: SmartEntry["media"],
  nowSeconds: number,
): number | null {
  const next = media.nextAiringEpisode
  if (next) return next.airingAt <= nowSeconds ? next.episode : next.episode - 1
  if (media.status === "FINISHED") return media.episodes
  return null
}

function startKey(sequel: Sequel): number {
  const year = sequel.startDate?.year ?? 9999
  return year * 100 + (sequel.startDate?.month ?? 13)
}

/**
 * The sequel that matters: the earliest direct sequel (TV, ONA or movie)
 * that isn't on your list, or is only in Want to watch.
 */
export function pendingSequel(
  entry: SmartEntry,
  listStatus: ReadonlyMap<number, MediaListStatus>,
): Sequel | undefined {
  return entry.sequels
    .filter((sequel) => SEQUEL_FORMATS.has(sequel.format))
    .filter((sequel) => {
      const status = listStatus.get(sequel.id)
      return status === undefined || status === "PLANNING"
    })
    .sort((a, b) => startKey(a) - startKey(b))[0]
}

export function smartStatus(
  entry: SmartEntry,
  {
    nowSeconds,
    listStatus,
  }: {
    nowSeconds: number
    /** AniList status of every entry on your list, by media ID. */
    listStatus: ReadonlyMap<number, MediaListStatus>
  },
): SmartStatus {
  switch (entry.status) {
    case "CURRENT":
    case "REPEATING": {
      const rewatching = entry.status === "REPEATING"
      const { media } = entry
      const aired = airedEpisodes(media, nowSeconds)
      if (
        media.status === "FINISHED" &&
        media.episodes &&
        entry.progress >= media.episodes
      ) {
        return { display: "completed", rewatching: false, autoComplete: true }
      }
      if (
        (media.status === "RELEASING" || media.status === "HIATUS") &&
        aired !== null &&
        entry.progress >= aired
      ) {
        const next = media.nextAiringEpisode
        return {
          display: "awaiting",
          rewatching,
          reason: next
            ? {
                kind: "episode",
                episode: next.episode,
                airingAt: next.airingAt,
              }
            : undefined,
        }
      }
      return { display: "watching", rewatching }
    }
    case "COMPLETED": {
      const sequel = pendingSequel(entry, listStatus)
      if (sequel?.status === "NOT_YET_RELEASED") {
        return {
          display: "awaiting",
          rewatching: false,
          reason: { kind: "sequel", sequel },
        }
      }
      if (sequel?.status === "RELEASING" || sequel?.status === "FINISHED") {
        return {
          display: "completed",
          rewatching: false,
          reason: { kind: "sequel-out", sequel },
        }
      }
      return { display: "completed", rewatching: false }
    }
    case "PLANNING":
      return { display: "planning", rewatching: false }
    case "PAUSED":
      return { display: "paused", rewatching: false }
    case "DROPPED":
      return { display: "dropped", rewatching: false }
  }
}
