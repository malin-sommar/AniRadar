import {
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs"

import {
  FORMATS,
  SEASONS,
  SORTS,
  STATUSES,
  type BrowseFilters,
} from "@/domain/browse"

/**
 * Browse filters in the URL, e.g.
 * `/browse?season=winter&year=2026&format=tv&genres=Fantasy&sort=score`.
 * Values that don't parse are ignored rather than breaking the page.
 */
export const browseParsers = {
  search: parseAsString.withDefault(""),
  genres: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  season: parseAsStringLiteral(SEASONS),
  year: parseAsInteger,
  formats: parseAsArrayOf(parseAsStringLiteral(FORMATS)).withDefault([]),
  statuses: parseAsArrayOf(parseAsStringLiteral(STATUSES)).withDefault([]),
  sort: parseAsStringLiteral(SORTS),
} satisfies Record<keyof BrowseFilters, unknown>

/** Short, readable names in the URL. */
export const browseUrlKeys = {
  search: "q",
  formats: "format",
  statuses: "status",
} as const

export const serializeBrowse = createSerializer(browseParsers, {
  urlKeys: browseUrlKeys,
})

/** `/browse?q=…`, for "See all results". */
export function browseSearchHref(search: string) {
  return serializeBrowse("/browse", { search: search.trim() || null })
}
