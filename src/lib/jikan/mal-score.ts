import { z } from "zod"

/** The MyAnimeList numbers shown on a detail page. */
export interface MalScore {
  malId: number
  url: string
  /** 1–10, or null when MAL has too few ratings. */
  score: number | null
  scoredBy: number | null
  rank: number | null
}

const jikanAnimeSchema = z.object({
  data: z.object({
    mal_id: z.int(),
    url: z.url(),
    score: z.number().min(0).max(10).nullish(),
    scored_by: z.int().nullish(),
    rank: z.int().nullish(),
  }),
})

/** Reads Jikan's `GET /anime/{id}` response. */
export function malScoreFromJikan(body: unknown): MalScore {
  const { data } = jikanAnimeSchema.parse(body)
  return {
    malId: data.mal_id,
    url: data.url,
    score: data.score ?? null,
    scoredBy: data.scored_by ?? null,
    rank: data.rank ?? null,
  }
}
