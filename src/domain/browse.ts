import type {
  MediaFormat,
  MediaSeason,
  MediaSort,
  MediaStatus,
} from "@/lib/anilist/gql/graphql"

import type { TitleLanguage } from "./media"

/*
 * Browse filters as they appear in the URL (lowercase slugs), and how they
 * turn into AniList query variables.
 */

export const SEASONS = ["winter", "spring", "summer", "fall"] as const
export type SeasonSlug = (typeof SEASONS)[number]

export const FORMATS = [
  "tv",
  "tv-short",
  "movie",
  "ova",
  "ona",
  "special",
] as const
export type FormatSlug = (typeof FORMATS)[number]

export const STATUSES = ["airing", "finished", "upcoming", "hiatus"] as const
export type StatusSlug = (typeof STATUSES)[number]

export const SORTS = [
  "relevance",
  "popularity",
  "score",
  "trending",
  "newest",
  "title",
] as const
export type SortSlug = (typeof SORTS)[number]

/** Most genres or tags one search may combine. */
export const MAX_TERMS = 10
/** Longest search text AniList is sent. */
export const MAX_SEARCH_LENGTH = 100
export const FIRST_YEAR = 1940
export const BROWSE_PAGE_SIZE = 30

export interface BrowseFilters {
  search: string
  genres: string[]
  tags: string[]
  season: SeasonSlug | null
  year: number | null
  formats: FormatSlug[]
  statuses: StatusSlug[]
  /** `null` means the default: best match while searching, else popularity. */
  sort: SortSlug | null
}

export const EMPTY_FILTERS: BrowseFilters = {
  search: "",
  genres: [],
  tags: [],
  season: null,
  year: null,
  formats: [],
  statuses: [],
  sort: null,
}

export const SEASON_LABELS: Record<SeasonSlug, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
}

export const FORMAT_FILTER_LABELS: Record<FormatSlug, string> = {
  tv: "TV",
  "tv-short": "TV Short",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
}

export const STATUS_LABELS: Record<StatusSlug, string> = {
  airing: "Airing",
  finished: "Finished",
  upcoming: "Upcoming",
  hiatus: "On hiatus",
}

export const SORT_LABELS: Record<SortSlug, string> = {
  relevance: "Best match",
  popularity: "Popularity",
  score: "Score",
  trending: "Trending",
  newest: "Newest",
  title: "Title",
}

const SEASON_ENUM: Record<SeasonSlug, MediaSeason> = {
  winter: "WINTER",
  spring: "SPRING",
  summer: "SUMMER",
  fall: "FALL",
}

const FORMAT_ENUM: Record<FormatSlug, MediaFormat> = {
  tv: "TV",
  "tv-short": "TV_SHORT",
  movie: "MOVIE",
  ova: "OVA",
  ona: "ONA",
  special: "SPECIAL",
}

const STATUS_ENUM: Record<StatusSlug, MediaStatus> = {
  airing: "RELEASING",
  finished: "FINISHED",
  upcoming: "NOT_YET_RELEASED",
  hiatus: "HIATUS",
}

const TITLE_SORT: Record<TitleLanguage, MediaSort> = {
  english: "TITLE_ENGLISH",
  romaji: "TITLE_ROMAJI",
  native: "TITLE_NATIVE",
}

/** Genres AniList treats as adult-only. */
export const ADULT_GENRES: readonly string[] = ["Hentai"]

export function hasSearch(filters: Pick<BrowseFilters, "search">): boolean {
  return filters.search.trim().length > 0
}

/** The sort in effect: "Best match" only makes sense with search text. */
export function effectiveSort(filters: BrowseFilters): SortSlug {
  const searching = hasSearch(filters)
  if (filters.sort === "relevance" && !searching) return "popularity"
  return filters.sort ?? (searching ? "relevance" : "popularity")
}

/** Sort choices to offer: "Best match" only while searching. */
export function sortOptions(filters: BrowseFilters): SortSlug[] {
  return hasSearch(filters)
    ? [...SORTS]
    : SORTS.filter((sort) => sort !== "relevance")
}

function sortEnums(sort: SortSlug, language: TitleLanguage): MediaSort[] {
  switch (sort) {
    case "relevance":
      return ["SEARCH_MATCH"]
    case "popularity":
      return ["POPULARITY_DESC"]
    // Ties are common for these, so popularity breaks them.
    case "score":
      return ["SCORE_DESC", "POPULARITY_DESC"]
    case "trending":
      return ["TRENDING_DESC", "POPULARITY_DESC"]
    case "newest":
      return ["START_DATE_DESC", "POPULARITY_DESC"]
    case "title":
      return [TITLE_SORT[language]]
  }
}

export interface ContentPreferences {
  showAdult: boolean
  titleLanguage: TitleLanguage
}

/**
 * `false` hides adult entries; `undefined` leaves the filter out so AniList
 * returns everything. (An explicit `null` would make AniList return nothing.)
 */
export function adultFilter(showAdult: boolean): false | undefined {
  return showAdult ? undefined : false
}

function nonEmpty<T>(values: readonly T[]): T[] | undefined {
  return values.length > 0 ? [...values] : undefined
}

/**
 * AniList variables for one browse query (without `page`). Empty filters
 * are left out, so equal searches always share a cache key.
 */
export function toBrowseVariables(
  filters: BrowseFilters,
  preferences: ContentPreferences,
  perPage: number = BROWSE_PAGE_SIZE,
) {
  const search = filters.search.trim().slice(0, MAX_SEARCH_LENGTH)
  return {
    perPage,
    search: search || undefined,
    genres: nonEmpty(filters.genres),
    tags: nonEmpty(filters.tags),
    season: filters.season ? SEASON_ENUM[filters.season] : undefined,
    seasonYear: filters.year ?? undefined,
    formats: nonEmpty(filters.formats.map((format) => FORMAT_ENUM[format])),
    statuses: nonEmpty(filters.statuses.map((status) => STATUS_ENUM[status])),
    sort: sortEnums(effectiveSort(filters), preferences.titleLanguage),
    isAdult: adultFilter(preferences.showAdult),
  }
}

export interface Tag {
  name: string
  category: string | null
  isAdult: boolean | null
  isGeneralSpoiler: boolean | null
}

export interface Taxonomy {
  genres: string[]
  tags: Tag[]
}

/** Genres to offer: adult ones only when adult content is on. */
export function visibleGenres(genres: readonly string[], showAdult: boolean) {
  return genres.filter((genre) => showAdult || !ADULT_GENRES.includes(genre))
}

/** "Theme-Action" → "Theme · Action". */
export function tagCategoryLabel(category: string | null): string {
  return category ? category.split("-").join(" · ") : "Other"
}

export interface TagGroup {
  category: string
  tags: Tag[]
}

/**
 * Tags to offer, grouped by category. Spoiler tags are never offered, and
 * adult tags only when adult content is on.
 */
export function groupTags(tags: readonly Tag[], showAdult: boolean) {
  const groups = new Map<string, Tag[]>()
  for (const tag of tags) {
    if (tag.isGeneralSpoiler) continue
    if (tag.isAdult && !showAdult) continue
    const category = tagCategoryLabel(tag.category)
    const group = groups.get(category) ?? []
    group.push(tag)
    groups.set(category, group)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupTags]): TagGroup => ({
      category,
      tags: groupTags.sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

/**
 * Cleans filters read from the URL: drops duplicates, out-of-range years,
 * and (once the lists have loaded) unknown or hidden genres and tags.
 * Spoiler tags stay if they're in the URL, since someone chose them.
 */
export function sanitizeFilters(
  filters: BrowseFilters,
  {
    taxonomy,
    showAdult,
    now = new Date(),
  }: { taxonomy?: Taxonomy; showAdult: boolean; now?: Date },
): BrowseFilters {
  const lastYear = now.getFullYear() + 2
  const knownTags = taxonomy
    ? new Map(taxonomy.tags.map((tag) => [tag.name, tag]))
    : undefined

  const genres = unique(filters.genres)
    .filter((genre) => showAdult || !ADULT_GENRES.includes(genre))
    .filter((genre) => !taxonomy || taxonomy.genres.includes(genre))
    .slice(0, MAX_TERMS)
  const tags = unique(filters.tags)
    .filter((name) => {
      if (!knownTags) return true
      const tag = knownTags.get(name)
      return tag !== undefined && (showAdult || !tag.isAdult)
    })
    .slice(0, MAX_TERMS)
  const year =
    filters.year !== null &&
    Number.isInteger(filters.year) &&
    filters.year >= FIRST_YEAR &&
    filters.year <= lastYear
      ? filters.year
      : null

  return {
    ...filters,
    search: filters.search.slice(0, MAX_SEARCH_LENGTH),
    genres,
    tags,
    year,
    formats: unique(filters.formats),
    statuses: unique(filters.statuses),
  }
}

/** Years to offer, newest first: next year down to 1940. */
export function yearOptions(now: Date = new Date()): number[] {
  const years: number[] = []
  for (let year = now.getFullYear() + 1; year >= FIRST_YEAR; year--) {
    years.push(year)
  }
  return years
}

export type FilterKey =
  "genres" | "tags" | "season" | "year" | "formats" | "statuses"

export interface ActiveFilter {
  key: FilterKey
  /** The value to remove; for single-value filters, the filter itself. */
  value: string
  label: string
}

/** One removable chip per active filter (search text and sort aren't chips). */
export function activeFilters(filters: BrowseFilters): ActiveFilter[] {
  return [
    ...(filters.season
      ? [
          {
            key: "season" as const,
            value: filters.season,
            label: SEASON_LABELS[filters.season],
          },
        ]
      : []),
    ...(filters.year !== null
      ? [
          {
            key: "year" as const,
            value: String(filters.year),
            label: String(filters.year),
          },
        ]
      : []),
    ...filters.formats.map((format) => ({
      key: "formats" as const,
      value: format,
      label: FORMAT_FILTER_LABELS[format],
    })),
    ...filters.statuses.map((status) => ({
      key: "statuses" as const,
      value: status,
      label: STATUS_LABELS[status],
    })),
    ...filters.genres.map((genre) => ({
      key: "genres" as const,
      value: genre,
      label: genre,
    })),
    ...filters.tags.map((tag) => ({
      key: "tags" as const,
      value: tag,
      label: tag,
    })),
  ]
}

/** The filters with one chip removed. */
export function removeFilter(
  filters: BrowseFilters,
  { key, value }: Pick<ActiveFilter, "key" | "value">,
): BrowseFilters {
  switch (key) {
    case "season":
      return { ...filters, season: null }
    case "year":
      return { ...filters, year: null }
    case "genres":
    case "tags":
    case "formats":
    case "statuses":
      return {
        ...filters,
        [key]: (filters[key] as string[]).filter((item) => item !== value),
      }
  }
}

/** Short summary for headings and screen readers, e.g. "Winter 2026 · TV · Fantasy". */
export function describeFilters(filters: BrowseFilters): string {
  const when = [
    filters.season ? SEASON_LABELS[filters.season] : undefined,
    filters.year ?? undefined,
  ]
    .filter((part) => part !== undefined)
    .join(" ")
  return [
    when,
    ...filters.formats.map((format) => FORMAT_FILTER_LABELS[format]),
    ...filters.statuses.map((status) => STATUS_LABELS[status]),
    ...filters.genres,
    ...filters.tags,
  ]
    .filter(Boolean)
    .join(" · ")
}

/**
 * Sort for the partial-word matches. "Best match" can't apply to an ID
 * lookup; those are put in the lookup's own order afterwards instead.
 */
export function matchSort(sort: readonly MediaSort[]): MediaSort[] {
  const rest = sort.filter((value) => value !== "SEARCH_MATCH")
  return rest.length > 0 ? rest : ["POPULARITY_DESC"]
}

/**
 * First page of a text search: the partial-word matches (best first when
 * sorting by best match, else in AniList's sort order), then AniList's own
 * whole-word results, each show once.
 */
export function mergeSearchResults<T extends { id: number }>({
  ranking,
  matches,
  results,
  byRelevance,
}: {
  /** IDs from the title lookup, best match first. */
  ranking: readonly number[]
  matches: readonly T[]
  results: readonly T[]
  byRelevance: boolean
}): T[] {
  const rank = (item: T) => {
    const index = ranking.indexOf(item.id)
    return index === -1 ? ranking.length : index
  }
  const ordered = byRelevance
    ? [...matches].sort((a, b) => rank(a) - rank(b))
    : matches
  const seen = new Set<number>()
  return [...ordered, ...results].filter(
    (item) => !seen.has(item.id) && seen.add(item.id),
  )
}
