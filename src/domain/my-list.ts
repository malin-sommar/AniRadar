import type {
  MediaCardFragment,
  MediaListStatus,
} from "@/lib/anilist/gql/graphql"

import { displayTitle, type TitleLanguage } from "./media"
import { compareStart } from "./series"
import { smartStatus, type Sequel, type SmartStatus } from "./smart-status"

/*
 * My list, per series (PLAN.md §10.0, §10.3): AniList's entries grouped into
 * series rows, with the series' status taken from its current season.
 */

/** One AniList list entry, as /api/me/list sends it. */
export interface ListEntry {
  entryId: number
  mediaId: number
  /** The series this entry belongs to (grouped on the server). */
  seriesId: number
  status: MediaListStatus
  progress: number
  /** 1–10 (AniList's 10-point decimal), or null when unscored. */
  score: number | null
  repeat: number
  /** Seconds since the epoch. */
  updatedAt: number
  media: MediaCardFragment & {
    startDate: {
      year: number | null
      month: number | null
      day: number | null
    } | null
  }
  sequels: Sequel[]
  /** Normalized streaming services (see domain/streaming). */
  services: string[]
}

export interface SeriesRow {
  id: number
  /** The series' first entry on your list, which names the series. */
  first: ListEntry
  /** Every entry of the series on your list, earliest first. */
  members: ListEntry[]
  /** The latest season you've started (or the first, if none). */
  current: ListEntry
  smart: SmartStatus
  /** Average of your season scores. */
  score: number | null
  updatedAt: number
  /** The soonest next episode of any season, in seconds. */
  nextAiringAt: number | null
  services: string[]
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return (
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  )
}

export function buildSeriesRows(
  entries: readonly ListEntry[],
  nowSeconds: number,
): SeriesRow[] {
  const listStatus = new Map(
    entries.map((entry) => [entry.mediaId, entry.status]),
  )
  const bySeries = new Map<number, ListEntry[]>()
  for (const entry of entries) {
    const group = bySeries.get(entry.seriesId) ?? []
    group.push(entry)
    bySeries.set(entry.seriesId, group)
  }

  return [...bySeries.entries()].map(([id, group]) => {
    const members = [...group].sort((a, b) => compareStart(a.media, b.media))
    const started = members.filter((entry) => entry.status !== "PLANNING")
    const current = started.at(-1) ?? (members[0] as ListEntry)
    const nextTimes = members
      .map((entry) => entry.media.nextAiringEpisode?.airingAt)
      .filter(
        (time): time is number => typeof time === "number" && time > nowSeconds,
      )
    return {
      id,
      first: members[0] as ListEntry,
      members,
      current,
      smart: smartStatus(current, { nowSeconds, listStatus }),
      score: average(
        members
          .map((entry) => entry.score)
          .filter((s): s is number => s !== null),
      ),
      updatedAt: Math.max(...members.map((entry) => entry.updatedAt)),
      nextAiringAt: nextTimes.length > 0 ? Math.min(...nextTimes) : null,
      services: [...new Set(members.flatMap((entry) => entry.services))].sort(),
    }
  })
}

export const LIST_TABS = [
  "all",
  "watching",
  "awaiting",
  "planning",
  "completed",
  "paused",
  "dropped",
] as const
export type ListTab = (typeof LIST_TABS)[number]

export const LIST_TAB_LABELS: Record<ListTab, string> = {
  all: "All",
  watching: "Watching",
  awaiting: "Awaiting",
  planning: "Want to watch",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
}

export function inTab(row: SeriesRow, tab: ListTab): boolean {
  return tab === "all" || row.smart.display === tab
}

export function tabCounts(rows: readonly SeriesRow[]): Record<ListTab, number> {
  const counts = Object.fromEntries(LIST_TABS.map((tab) => [tab, 0])) as Record<
    ListTab,
    number
  >
  for (const row of rows) {
    counts.all++
    counts[row.smart.display]++
  }
  return counts
}

/** Matches any title of any season, ignoring case. */
export function matchesSearch(row: SeriesRow, text: string): boolean {
  const needle = text.trim().toLowerCase()
  if (!needle) return true
  return row.members.some((entry) =>
    Object.values(entry.media.title ?? {}).some(
      (title) =>
        typeof title === "string" && title.toLowerCase().includes(needle),
    ),
  )
}

/** Any of the chosen services (OR); no choice keeps every row. */
export function onServices(
  row: SeriesRow,
  services: readonly string[],
): boolean {
  return services.length === 0 || services.some((s) => row.services.includes(s))
}

/** How many rows each service has, for the filter chips. */
export function serviceCounts(rows: readonly SeriesRow[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const service of row.services) {
      counts.set(service, (counts.get(service) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )
}

export const LIST_SORTS = [
  "updated",
  "title",
  "airing",
  "score",
  "newest",
] as const
export type ListSort = (typeof LIST_SORTS)[number]

export const LIST_SORT_LABELS: Record<ListSort, string> = {
  updated: "Last updated",
  title: "Title",
  airing: "Next airing",
  score: "Your score",
  newest: "Newest",
}

/** Missing values (no score, nothing airing) always go last. */
export function sortRows(
  rows: readonly SeriesRow[],
  sort: ListSort,
  language: TitleLanguage,
): SeriesRow[] {
  const title = (row: SeriesRow) =>
    displayTitle(row.first.media.title, language)
  const last = (value: number | null, descending: boolean) =>
    value === null ? Number.POSITIVE_INFINITY : descending ? -value : value
  const compare: Record<ListSort, (a: SeriesRow, b: SeriesRow) => number> = {
    updated: (a, b) => b.updatedAt - a.updatedAt,
    title: (a, b) => title(a).localeCompare(title(b)),
    airing: (a, b) => last(a.nextAiringAt, false) - last(b.nextAiringAt, false),
    score: (a, b) => last(a.score, true) - last(b.score, true),
    newest: (a, b) => compareStart(b.first.media, a.first.media),
  }
  return [...rows].sort(
    (a, b) => compare[sort](a, b) || title(a).localeCompare(title(b)),
  )
}

/** "Ep 5 / 12", "Ep 5", or nothing for shows you haven't started. */
export function progressLabel(entry: ListEntry): string | undefined {
  if (entry.status === "PLANNING" && entry.progress === 0) return undefined
  const total = entry.media.episodes
  return total ? `Ep ${entry.progress} / ${total}` : `Ep ${entry.progress}`
}
