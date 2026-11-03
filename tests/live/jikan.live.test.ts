import { describe, expect, it } from "vitest"

import { malScoreFromJikan } from "@/lib/jikan/mal-score"

describe("Jikan (live)", () => {
  it("still answers GET /anime/{id} in the shape we expect", async () => {
    const response = await fetch("https://api.jikan.moe/v4/anime/16498", {
      headers: { Accept: "application/json" },
    })
    expect(response.status).toBe(200)
    const score = malScoreFromJikan(await response.json())
    expect(score.malId).toBe(16498)
    expect(score.score).toEqual(expect.any(Number))
  })
})
