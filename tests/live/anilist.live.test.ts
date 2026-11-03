import { describe, expect, it } from "vitest"

import {
  createAniListClient,
  type AniListTransport,
} from "@/lib/anilist/core/client"
import { RateLimiter } from "@/lib/anilist/core/limiter"
import { documentFor, type OperationData } from "@/lib/anilist/registry"

const transport: AniListTransport = async ({ query, variables, signal }) => {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  })
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json().catch(() => undefined),
  }
}

const client = createAniListClient({
  transport,
  limiter: new RateLimiter({ requestsPerMinute: 10, capacity: 1 }),
})

describe("AniList (live)", () => {
  it("still answers TrendingAnime in the shape we expect", async () => {
    const data = await client.request<OperationData<"TrendingAnime">>(
      documentFor("TrendingAnime"),
      {
        page: 1,
        perPage: 5,
        isAdult: false,
      },
    )
    const media = data.Page?.media ?? []
    expect(media.length).toBeGreaterThan(0)
    for (const item of media) {
      expect(item?.id).toEqual(expect.any(Number))
      expect(item?.coverImage?.large).toMatch(/^https:\/\/s4\.anilist\.co\//)
      expect(item?.isAdult).toBe(false)
    }
  })
})
