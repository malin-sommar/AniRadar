import { describe, expect, it } from "vitest"

import fixture from "../../../tests/fixtures/jikan/anime-16498.json"
import { malScoreFromJikan } from "./mal-score"

// The fixture follows Jikan's documented `GET /anime/{id}` shape; its
// numbers are illustrative.
describe("malScoreFromJikan", () => {
  it("reads the score, rank and link", () => {
    expect(malScoreFromJikan(fixture)).toEqual({
      malId: 16498,
      url: "https://myanimelist.net/anime/16498/Shingeki_no_Kyojin",
      score: 8.55,
      scoredBy: 2_900_000,
      rank: 117,
    })
  })

  it("allows a show MAL hasn't scored yet", () => {
    const unscored = {
      data: { ...fixture.data, score: null, scored_by: null, rank: null },
    }
    expect(malScoreFromJikan(unscored).score).toBeNull()
  })

  it("rejects an unexpected shape", () => {
    expect(() => malScoreFromJikan({ data: { id: 1 } })).toThrow()
  })
})
