import { createLoader } from "nuqs/server"
import { describe, expect, it } from "vitest"

import {
  browseParsers,
  browseSearchHref,
  browseUrlKeys,
  serializeBrowse,
} from "./search-params"

const load = createLoader(browseParsers, { urlKeys: browseUrlKeys })

describe("browse URL state", () => {
  it("round-trips every filter through a shareable URL", () => {
    const url = serializeBrowse("/browse", {
      search: "frieren",
      genres: ["Fantasy", "Slice of Life"],
      tags: ["Magic"],
      season: "winter",
      year: 2026,
      formats: ["tv", "movie"],
      statuses: ["airing"],
      sort: "score",
    })
    expect(url).toContain("q=frieren")
    expect(url).toContain("format=tv,movie")

    const filters = load(new URL(url, "http://localhost").searchParams)
    expect(filters).toEqual({
      search: "frieren",
      genres: ["Fantasy", "Slice of Life"],
      tags: ["Magic"],
      season: "winter",
      year: 2026,
      formats: ["tv", "movie"],
      statuses: ["airing"],
      sort: "score",
    })
  })

  it("ignores values that don't parse", () => {
    const filters = load(
      new URLSearchParams(
        "season=monsoon&year=soon&format=tv,cd&status=lost&sort=random",
      ),
    )
    expect(filters.season).toBeNull()
    expect(filters.year).toBeNull()
    expect(filters.formats).toEqual(["tv"])
    expect(filters.statuses).toEqual([])
    expect(filters.sort).toBeNull()
  })

  it("links to a plain search", () => {
    expect(browseSearchHref("  one piece ")).toBe("/browse?q=one+piece")
    expect(browseSearchHref("")).toBe("/browse")
  })
})
