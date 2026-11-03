import { describe, expect, it } from "vitest"

import {
  aniListIdsFromKitsu,
  kitsuSearchParams,
  normalizeSearchText,
} from "./title-matches"

// Trimmed from a real `GET /anime?filter[text]=juju&include=mappings`.
const response = {
  data: [
    {
      id: "42765",
      type: "anime",
      relationships: {
        mappings: {
          data: [
            { type: "mappings", id: "256859" },
            { type: "mappings", id: "253155" },
          ],
        },
      },
    },
    {
      // No AniList mapping: skipped.
      id: "99999",
      type: "anime",
      relationships: { mappings: { data: [{ type: "mappings", id: "1" }] } },
    },
    {
      id: "6902",
      type: "anime",
      relationships: {
        mappings: {
          data: [
            { type: "mappings", id: "4609" },
            { type: "mappings", id: "268998" },
          ],
        },
      },
    },
  ],
  included: [
    {
      id: "256859",
      type: "mappings",
      attributes: { externalSite: "anilist/anime", externalId: "113415" },
    },
    {
      id: "253155",
      type: "mappings",
      attributes: { externalSite: "myanimelist/anime", externalId: "40748" },
    },
    {
      id: "1",
      type: "mappings",
      attributes: { externalSite: "anidb", externalId: "123" },
    },
    {
      id: "4609",
      type: "mappings",
      attributes: { externalSite: "myanimelist/anime", externalId: "13173" },
    },
    {
      id: "268998",
      type: "mappings",
      attributes: { externalSite: "anilist/anime", externalId: "13173" },
    },
  ],
}

describe("aniListIdsFromKitsu", () => {
  it("returns AniList IDs in Kitsu's ranking order", () => {
    expect(aniListIdsFromKitsu(response)).toEqual([113415, 13173])
  })

  it("handles a search with no results", () => {
    expect(aniListIdsFromKitsu({ data: [] })).toEqual([])
  })

  it("ignores mappings with IDs that aren't numbers", () => {
    expect(
      aniListIdsFromKitsu({
        data: response.data.slice(0, 1),
        included: [
          {
            id: "256859",
            type: "mappings",
            attributes: { externalSite: "anilist/anime", externalId: "abc" },
          },
        ],
      }),
    ).toEqual([])
  })

  it("rejects a response in an unexpected shape", () => {
    expect(() => aniListIdsFromKitsu({ results: [] })).toThrow()
  })
})

describe("search text", () => {
  it("normalizes text so equal searches share a cache entry", () => {
    expect(normalizeSearchText("  Jujutsu   KAISEN ")).toBe("jujutsu kaisen")
  })

  it("asks Kitsu for AniList mappings only", () => {
    const params = kitsuSearchParams("juju")
    expect(params.get("filter[text]")).toBe("juju")
    expect(params.get("include")).toBe("mappings")
    expect(params.get("fields[mappings]")).toBe("externalSite,externalId")
  })
})
