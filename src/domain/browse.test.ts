import { describe, expect, it } from "vitest"

import {
  EMPTY_FILTERS,
  activeFilters,
  describeFilters,
  effectiveSort,
  groupTags,
  matchSort,
  mergeSearchResults,
  removeFilter,
  sanitizeFilters,
  sortOptions,
  toBrowseVariables,
  visibleGenres,
  yearOptions,
  type BrowseFilters,
  type Tag,
  type Taxonomy,
} from "./browse"

const DEFAULTS = { showAdult: false, titleLanguage: "english" } as const

function filters(changes: Partial<BrowseFilters> = {}): BrowseFilters {
  return { ...EMPTY_FILTERS, ...changes }
}

const tags: Tag[] = [
  {
    name: "Magic",
    category: "Theme-Fantasy",
    isAdult: false,
    isGeneralSpoiler: false,
  },
  {
    name: "Isekai",
    category: "Theme-Fantasy",
    isAdult: false,
    isGeneralSpoiler: false,
  },
  {
    name: "Time Loop",
    category: "Theme-Sci-Fi",
    isAdult: false,
    isGeneralSpoiler: true,
  },
  {
    name: "Nudity",
    category: "Sexual Content",
    isAdult: true,
    isGeneralSpoiler: false,
  },
  {
    name: "Tsundere",
    category: "Cast-Traits",
    isAdult: false,
    isGeneralSpoiler: null,
  },
]

const taxonomy: Taxonomy = {
  genres: ["Action", "Fantasy", "Hentai", "Romance"],
  tags,
}

describe("toBrowseVariables", () => {
  it("leaves out empty filters and hides adult entries by default", () => {
    expect(toBrowseVariables(EMPTY_FILTERS, DEFAULTS)).toEqual({
      perPage: 30,
      search: undefined,
      genres: undefined,
      tags: undefined,
      season: undefined,
      seasonYear: undefined,
      formats: undefined,
      statuses: undefined,
      sort: ["POPULARITY_DESC"],
      isAdult: false,
    })
  })

  it("maps a combined filter (Winter 2026 · TV · Fantasy · by score)", () => {
    const variables = toBrowseVariables(
      filters({
        season: "winter",
        year: 2026,
        formats: ["tv", "tv-short"],
        statuses: ["airing", "upcoming"],
        genres: ["Fantasy"],
        tags: ["Magic"],
        sort: "score",
      }),
      DEFAULTS,
    )
    expect(variables).toMatchObject({
      season: "WINTER",
      seasonYear: 2026,
      formats: ["TV", "TV_SHORT"],
      statuses: ["RELEASING", "NOT_YET_RELEASED"],
      genres: ["Fantasy"],
      tags: ["Magic"],
      sort: ["SCORE_DESC", "POPULARITY_DESC"],
    })
  })

  it("trims search text and sorts by best match while searching", () => {
    const variables = toBrowseVariables(
      filters({ search: "  frieren " }),
      DEFAULTS,
    )
    expect(variables.search).toBe("frieren")
    expect(variables.sort).toEqual(["SEARCH_MATCH"])
  })

  it("leaves the adult filter out once adult content is switched on", () => {
    expect(
      toBrowseVariables(EMPTY_FILTERS, { ...DEFAULTS, showAdult: true })
        .isAdult,
    ).toBeUndefined()
  })

  it("sorts titles in the chosen title language", () => {
    const byTitle = filters({ sort: "title" })
    expect(toBrowseVariables(byTitle, DEFAULTS).sort).toEqual(["TITLE_ENGLISH"])
    expect(
      toBrowseVariables(byTitle, { ...DEFAULTS, titleLanguage: "romaji" }).sort,
    ).toEqual(["TITLE_ROMAJI"])
  })

  it("uses the requested page size", () => {
    expect(toBrowseVariables(EMPTY_FILTERS, DEFAULTS, 8).perPage).toBe(8)
  })
})

describe("sorting", () => {
  it("defaults to popularity, or best match while searching", () => {
    expect(effectiveSort(EMPTY_FILTERS)).toBe("popularity")
    expect(effectiveSort(filters({ search: "x" }))).toBe("relevance")
    expect(effectiveSort(filters({ search: "x", sort: "newest" }))).toBe(
      "newest",
    )
  })

  it("falls back to popularity when best match has nothing to match", () => {
    expect(effectiveSort(filters({ sort: "relevance" }))).toBe("popularity")
  })

  it("only offers best match while searching", () => {
    expect(sortOptions(EMPTY_FILTERS)).not.toContain("relevance")
    expect(sortOptions(filters({ search: "x" }))[0]).toBe("relevance")
  })
})

describe("genre and tag lists", () => {
  it("hides adult genres unless adult content is on", () => {
    expect(visibleGenres(taxonomy.genres, false)).toEqual([
      "Action",
      "Fantasy",
      "Romance",
    ])
    expect(visibleGenres(taxonomy.genres, true)).toContain("Hentai")
  })

  it("groups tags by category and never offers spoiler tags", () => {
    expect(groupTags(tags, false)).toEqual([
      { category: "Cast · Traits", tags: [tags[4]] },
      { category: "Theme · Fantasy", tags: [tags[1], tags[0]] },
    ])
  })

  it("offers adult tags once adult content is on", () => {
    const categories = groupTags(tags, true).map((group) => group.category)
    expect(categories).toContain("Sexual Content")
    expect(categories).not.toContain("Theme · Sci · Fi")
  })
})

describe("sanitizeFilters", () => {
  const now = new Date("2026-11-03T12:00:00Z")

  it("drops unknown, duplicate and hidden genres and tags", () => {
    const result = sanitizeFilters(
      filters({
        genres: ["Fantasy", "Fantasy", "Hentai", "Cooking"],
        tags: ["Magic", "Nudity", "Made Up"],
      }),
      { taxonomy, showAdult: false, now },
    )
    expect(result.genres).toEqual(["Fantasy"])
    expect(result.tags).toEqual(["Magic"])
  })

  it("keeps adult genres and tags when adult content is on", () => {
    const result = sanitizeFilters(
      filters({ genres: ["Hentai"], tags: ["Nudity"] }),
      { taxonomy, showAdult: true, now },
    )
    expect(result.genres).toEqual(["Hentai"])
    expect(result.tags).toEqual(["Nudity"])
  })

  it("keeps a spoiler tag someone put in the URL", () => {
    const result = sanitizeFilters(filters({ tags: ["Time Loop"] }), {
      taxonomy,
      showAdult: false,
      now,
    })
    expect(result.tags).toEqual(["Time Loop"])
  })

  it("keeps names as they are until the lists have loaded", () => {
    const result = sanitizeFilters(filters({ genres: ["Cooking", "Hentai"] }), {
      showAdult: false,
      now,
    })
    expect(result.genres).toEqual(["Cooking"])
  })

  it("drops years outside 1940 to two years ahead", () => {
    const check = (year: number) =>
      sanitizeFilters(filters({ year }), { showAdult: false, now }).year
    expect(check(1939)).toBeNull()
    expect(check(2029)).toBeNull()
    expect(check(2028)).toBe(2028)
    expect(check(1940)).toBe(1940)
  })

  it("caps genres and tags at ten each", () => {
    const many = Array.from({ length: 12 }, (_, index) => `Tag ${index}`)
    const result = sanitizeFilters(filters({ tags: many }), {
      showAdult: false,
      now,
    })
    expect(result.tags).toHaveLength(10)
  })
})

describe("active filter chips", () => {
  const active = filters({
    season: "winter",
    year: 2026,
    formats: ["tv"],
    genres: ["Fantasy", "Romance"],
  })

  it("lists one chip per value", () => {
    expect(activeFilters(active).map((chip) => chip.label)).toEqual([
      "Winter",
      "2026",
      "TV",
      "Fantasy",
      "Romance",
    ])
  })

  it("removes exactly one chip", () => {
    expect(
      removeFilter(active, { key: "genres", value: "Fantasy" }).genres,
    ).toEqual(["Romance"])
    expect(removeFilter(active, { key: "year", value: "2026" }).year).toBeNull()
    expect(
      removeFilter(active, { key: "season", value: "winter" }).season,
    ).toBeNull()
  })

  it("describes the filters in one line", () => {
    expect(describeFilters(active)).toBe("Winter 2026 · TV · Fantasy · Romance")
    expect(describeFilters(EMPTY_FILTERS)).toBe("")
  })
})

describe("yearOptions", () => {
  it("runs from next year down to 1940", () => {
    const years = yearOptions(new Date("2026-11-03"))
    expect(years[0]).toBe(2027)
    expect(years.at(-1)).toBe(1940)
  })
})

describe("search results", () => {
  const show = (id: number) => ({ id })

  it("puts partial-word matches first, in the lookup's order", () => {
    expect(
      mergeSearchResults({
        ranking: [3, 1, 2],
        matches: [show(1), show(2), show(3)],
        results: [show(9), show(1)],
        byRelevance: true,
      }).map((item) => item.id),
    ).toEqual([3, 1, 2, 9])
  })

  it("keeps AniList's order for the matches under another sort", () => {
    expect(
      mergeSearchResults({
        ranking: [3, 1, 2],
        matches: [show(2), show(3)],
        results: [show(3), show(7)],
        byRelevance: false,
      }).map((item) => item.id),
    ).toEqual([2, 3, 7])
  })

  it("sorts the matches by popularity when best match is asked for", () => {
    expect(matchSort(["SEARCH_MATCH"])).toEqual(["POPULARITY_DESC"])
    expect(matchSort(["SCORE_DESC", "POPULARITY_DESC"])).toEqual([
      "SCORE_DESC",
      "POPULARITY_DESC",
    ])
  })
})
