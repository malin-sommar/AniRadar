import type {
  MediaFormat,
  MediaRelation,
  MediaSeason,
  MediaType,
} from "@/lib/anilist/gql/graphql"

import type { MediaTitleFields } from "./media"

/*
 * Groups browse and search results into series (PLAN.md §10.0): entries
 * linked by PREQUEL/SEQUEL relations are one series. Only links between
 * results count, so this needs no extra requests.
 */

/** The fields grouping needs (MediaCard + SeriesLinks). */
export interface SeriesItem {
  id: number
  format: MediaFormat | null
  season: MediaSeason | null
  seasonYear: number | null
  isAdult: boolean | null
  startDate: {
    year: number | null
    month: number | null
    day: number | null
  } | null
  nextAiringEpisode: { airingAt: number; episode: number } | null
  relations: {
    edges: Array<{
      relationType: MediaRelation | null
      node: {
        id: number
        type: MediaType | null
        format: MediaFormat | null
        title: MediaTitleFields | null
      } | null
    } | null> | null
  } | null
}

export interface SeriesGroup<T extends SeriesItem> {
  /** The series' first main-story entry among the results (TV, ONA or movie). */
  first: T
  /** Every result in the series, earliest first. */
  members: T[]
  /** Main-story entries among the results. */
  seasons: number
  /** First and last start year among the members. */
  years: [number, number] | null
  /** The member whose next episode airs soonest. */
  airing: T | undefined
  /** The season before `first`, when it isn't among the results. */
  continues: { id: number; title: MediaTitleFields | null } | null
}

const CHAIN: ReadonlySet<MediaRelation | null> = new Set(["PREQUEL", "SEQUEL"])

/** Formats that count as the main story (movies included, PLAN.md Q9). */
export const MAIN_STORY_FORMATS: ReadonlySet<MediaFormat | null> = new Set([
  "TV",
  "TV_SHORT",
  "ONA",
  "MOVIE",
])

const SEASON_ORDER: Record<MediaSeason, number> = {
  WINTER: 1,
  SPRING: 2,
  SUMMER: 3,
  FALL: 4,
}

function startKey(item: SeriesItem): number[] {
  const year =
    item.startDate?.year ?? item.seasonYear ?? Number.MAX_SAFE_INTEGER
  const month =
    item.startDate?.month ??
    (item.season ? SEASON_ORDER[item.season] * 3 - 2 : 13)
  return [year, month, item.startDate?.day ?? 32, item.id]
}

function compareStart(a: SeriesItem, b: SeriesItem): number {
  const [ka, kb] = [startKey(a), startKey(b)]
  for (let index = 0; index < ka.length; index++) {
    const diff = (ka[index] as number) - (kb[index] as number)
    if (diff !== 0) return diff
  }
  return 0
}

function chainLinks(item: SeriesItem) {
  return (item.relations?.edges ?? []).filter(
    (edge) =>
      CHAIN.has(edge?.relationType ?? null) && edge?.node?.type === "ANIME",
  )
}

/**
 * Groups results into series, keeping the order of each series' best-ranked
 * result. Works across every loaded page, so a season arriving on page 2
 * joins its series' card instead of getting its own.
 */
export function groupIntoSeries<T extends SeriesItem>(
  items: readonly T[],
): SeriesGroup<T>[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const parent = new Map(items.map((item) => [item.id, item.id]))
  const find = (id: number): number => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root) as number
    parent.set(id, root)
    return root
  }
  for (const item of items) {
    for (const edge of chainLinks(item)) {
      const other = edge?.node?.id
      if (other !== undefined && byId.has(other)) {
        parent.set(find(item.id), find(other))
      }
    }
  }

  const groups = new Map<number, T[]>()
  for (const item of items) {
    const root = find(item.id)
    const members = groups.get(root) ?? []
    members.push(item)
    groups.set(root, members)
  }

  return [...groups.values()].map((unordered) => {
    const members = [...unordered].sort(compareStart)
    const main = members.filter((item) => MAIN_STORY_FORMATS.has(item.format))
    const first = main[0] ?? (members[0] as T)
    const years = members
      .map((item) => item.startDate?.year ?? item.seasonYear)
      .filter((year): year is number => typeof year === "number")
    const airing = members
      .filter((item) => item.nextAiringEpisode)
      .sort(
        (a, b) =>
          (a.nextAiringEpisode?.airingAt ?? 0) -
          (b.nextAiringEpisode?.airingAt ?? 0),
      )[0]
    const previous = chainLinks(first).find(
      (edge) =>
        edge?.relationType === "PREQUEL" && !byId.has(edge.node?.id ?? 0),
    )?.node
    return {
      first,
      members,
      seasons: main.length,
      years: years.length > 0 ? [Math.min(...years), Math.max(...years)] : null,
      airing,
      continues: previous ? { id: previous.id, title: previous.title } : null,
    }
  })
}

/** "2013–2023", or one year. */
export function yearsLabel(years: [number, number] | null): string | undefined {
  if (!years) return undefined
  return years[0] === years[1] ? String(years[0]) : `${years[0]}–${years[1]}`
}

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`

/**
 * The main story's size: "6 seasons", "3 films" or "10 seasons · 3 films".
 * Undefined for a single entry.
 */
export function mainStoryLabel(
  formats: ReadonlyArray<MediaFormat | null>,
): string | undefined {
  const main = formats.filter((format) => MAIN_STORY_FORMATS.has(format))
  if (main.length <= 1) return undefined
  const films = main.filter((format) => format === "MOVIE").length
  const seasons = main.length - films
  return [
    seasons > 0 ? plural(seasons, "season") : undefined,
    films > 0 ? plural(films, "film") : undefined,
  ]
    .filter(Boolean)
    .join(" · ")
}

/** How many entries a series card stands for, e.g. "6 seasons" or "3 entries". */
export function seriesCountLabel(
  group: Pick<SeriesGroup<SeriesItem>, "members">,
): string | undefined {
  const main = mainStoryLabel(group.members.map((item) => item.format))
  if (main) return main
  return group.members.length > 1
    ? `${group.members.length} entries`
    : undefined
}
