import { HttpResponse, http } from "msw"
import { describe, expect, it, vi } from "vitest"

import { server, setupMockServer } from "../../../../tests/msw/server"

import { createAniListClient, type AniListTransport } from "./client"
import { RateLimiter } from "./limiter"

setupMockServer()

const ENDPOINT = "https://graphql.anilist.co"

// Same shape as the server transport in server.ts, minus the Next.js bits,
// so real fetch/Headers handling is covered end to end.
const fetchTransport: AniListTransport = async ({
  query,
  variables,
  signal,
}) => {
  const response = await fetch(ENDPOINT, {
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

function makeClient(
  limiter = new RateLimiter({ requestsPerMinute: 60, capacity: 10 }),
) {
  return createAniListClient({
    transport: fetchTransport,
    limiter,
    sleep: async () => {},
  })
}

const document = {
  operationName: "TrendingAnime",
  query: "query TrendingAnime { Page { media { id } } }",
}

describe("AniList client over HTTP", () => {
  it("sends the query and variables as GraphQL JSON", async () => {
    let received: unknown
    server.use(
      http.post(ENDPOINT, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(
          { data: { Page: { media: [{ id: 1 }] } } },
          {
            headers: {
              "X-RateLimit-Limit": "30",
              "X-RateLimit-Remaining": "29",
            },
          },
        )
      }),
    )

    const limiter = new RateLimiter({
      requestsPerMinute: 60,
      maxRequestsPerMinute: 76,
      capacity: 10,
    })
    await expect(
      makeClient(limiter).request(document, { page: 1 }),
    ).resolves.toEqual({
      Page: { media: [{ id: 1 }] },
    })
    expect(received).toEqual({ query: document.query, variables: { page: 1 } })
    expect(limiter.snapshot()).toMatchObject({
      reportedLimit: 30,
      reportedRemaining: 29,
      requestsPerMinute: 25,
    })
  })

  it("waits out a real 429 response and then succeeds", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    try {
      let calls = 0
      server.use(
        http.post(ENDPOINT, () => {
          calls++
          return calls === 1
            ? HttpResponse.json(
                {
                  data: null,
                  errors: [{ message: "Too Many Requests.", status: 429 }],
                },
                { status: 429, headers: { "Retry-After": "2" } },
              )
            : HttpResponse.json({ data: { ok: true } })
        }),
      )

      const result = makeClient().request(document)
      await vi.advanceTimersByTimeAsync(2_500)
      await expect(result).resolves.toEqual({ ok: true })
      expect(calls).toBe(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
