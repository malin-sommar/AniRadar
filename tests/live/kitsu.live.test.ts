import { describe, expect, it } from "vitest"

import {
  aniListIdsFromKitsu,
  kitsuSearchParams,
} from "@/lib/kitsu/title-matches"

describe("Kitsu (live)", () => {
  it("still matches partial words and maps them to AniList IDs", async () => {
    const response = await fetch(
      `https://kitsu.io/api/edge/anime?${kitsuSearchParams("juju")}`,
      { headers: { Accept: "application/vnd.api+json" } },
    )
    expect(response.status).toBe(200)
    // Jujutsu Kaisen on AniList.
    expect(aniListIdsFromKitsu(await response.json())).toContain(113415)
  })
})
