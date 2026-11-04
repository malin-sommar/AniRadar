import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AniListError } from "@/lib/anilist/core/errors"
import { getAniList } from "@/lib/anilist/server"

import { GET } from "./route"

vi.mock("@/lib/anilist/server", () => ({ getAniList: vi.fn() }))

const mockedGetAniList = vi.mocked(getAniList)

function call(op: string, variables?: string) {
  const url = new URL(`http://localhost/api/anilist/${op}`)
  if (variables !== undefined) url.searchParams.set("v", variables)
  return GET(new NextRequest(url), { params: Promise.resolve({ op }) })
}

async function errorOf(response: Response) {
  const body = (await response.json()) as {
    errors: { message: string; kind?: string }[]
  }
  return body.errors[0]
}

beforeEach(() => {
  mockedGetAniList.mockReset()
})

describe("GET /api/anilist/[op]", () => {
  it("refuses server-only operations such as a user's list", async () => {
    const response = await call("MyAnimeList", JSON.stringify({ userId: 1 }))
    expect(response.status).toBe(404)
    expect(mockedGetAniList).not.toHaveBeenCalled()
  })

  it("rejects operations that aren't on the allowlist", async () => {
    const response = await call("Viewer", "{}")
    expect(response.status).toBe(404)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(mockedGetAniList).not.toHaveBeenCalled()
  })

  it.each([
    ["not JSON", "{oops"],
    ["out-of-range values", JSON.stringify({ perPage: 500 })],
    [
      "unknown keys (no smuggled queries)",
      JSON.stringify({ query: "{ Viewer { id } }" }),
    ],
    ["wrong types", JSON.stringify({ page: "1" })],
    ["oversized input", JSON.stringify({ page: 1, padding: "x".repeat(3000) })],
  ])("rejects %s with 400", async (_label, variables) => {
    const response = await call("TrendingAnime", variables)
    expect(response.status).toBe(400)
    expect(mockedGetAniList).not.toHaveBeenCalled()
  })

  it("returns data with CDN cache headers from the operation's policy", async () => {
    mockedGetAniList.mockResolvedValue({ Page: { pageInfo: null, media: [] } })

    const response = await call(
      "TrendingAnime",
      JSON.stringify({ page: 1, perPage: 25, isAdult: false }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: { Page: { pageInfo: null, media: [] } },
    })
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, s-maxage=1800, stale-while-revalidate=19800",
    )
    expect(mockedGetAniList).toHaveBeenCalledWith("TrendingAnime", {
      page: 1,
      perPage: 25,
      isAdult: false,
    })
  })

  it("passes AniList's rate limit on to the browser with Retry-After", async () => {
    mockedGetAniList.mockRejectedValue(
      new AniListError("rate_limited", "AniList's rate limit was reached", {
        retryAfterMs: 42_100,
      }),
    )

    const response = await call("TrendingAnime", "{}")
    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("43")
    expect(await errorOf(response)).toMatchObject({ kind: "rate_limited" })
  })

  it("answers 503 while AniList's API is switched off", async () => {
    mockedGetAniList.mockRejectedValue(
      new AniListError("api_disabled", "Disabled", { retryAfterMs: 60_000 }),
    )

    const response = await call("TrendingAnime", "{}")
    expect(response.status).toBe(503)
    expect(await errorOf(response)).toMatchObject({ kind: "api_disabled" })
  })

  it("maps AniList's not-found to 404 and other query errors to 502", async () => {
    mockedGetAniList.mockRejectedValueOnce(
      new AniListError("graphql", "Not Found.", { status: 404 }),
    )
    expect((await call("TrendingAnime", "{}")).status).toBe(404)

    mockedGetAniList.mockRejectedValueOnce(
      new AniListError("graphql", "Bad query", { status: 400 }),
    )
    const response = await call("TrendingAnime", "{}")
    expect(response.status).toBe(502)
    expect(await errorOf(response)).toMatchObject({ kind: "graphql" })
  })

  it("hides unexpected errors behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockedGetAniList.mockRejectedValue(new Error("secret internals"))

    const response = await call("TrendingAnime", "{}")
    expect(response.status).toBe(500)
    expect(await errorOf(response)).toMatchObject({
      message: "Unexpected error",
    })
  })
})
