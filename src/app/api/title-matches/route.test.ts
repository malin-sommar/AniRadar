import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTitleMatches } from "@/lib/kitsu/server"

import { GET } from "./route"

vi.mock("@/lib/kitsu/server", () => ({ getTitleMatches: vi.fn() }))

const mockedGetTitleMatches = vi.mocked(getTitleMatches)

function call(q?: string) {
  const url = new URL("http://localhost/api/title-matches")
  if (q !== undefined) url.searchParams.set("q", q)
  return GET(new NextRequest(url))
}

beforeEach(() => {
  mockedGetTitleMatches.mockReset()
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

describe("GET /api/title-matches", () => {
  it("returns the matching AniList IDs, cacheable at the CDN", async () => {
    mockedGetTitleMatches.mockResolvedValue([113415, 13173])
    const response = await call("juju")
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ids: [113415, 13173] })
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=")
    expect(mockedGetTitleMatches).toHaveBeenCalledWith("juju")
  })

  it.each([
    ["missing", undefined],
    ["too short", "j"],
    ["too long", "x".repeat(101)],
  ])("rejects text that is %s", async (_label, q) => {
    const response = await call(q)
    expect(response.status).toBe(400)
    expect(mockedGetTitleMatches).not.toHaveBeenCalled()
  })

  it("answers with no matches when Kitsu fails, without caching", async () => {
    mockedGetTitleMatches.mockRejectedValue(new Error("timeout"))
    const response = await call("juju")
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ids: [] })
    expect(response.headers.get("Cache-Control")).toBe("no-store")
  })
})
