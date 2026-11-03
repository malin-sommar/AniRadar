import { describe, expect, it, vi } from "vitest"

vi.mock("./supabase", () => ({ createAdminClient: vi.fn() }))

import { authorizeUrl, checkState, createState } from "./anilist-account"

const USER = "11111111-1111-1111-1111-111111111111"

describe("AniList OAuth state", () => {
  it("accepts the state it issued, for the same user", () => {
    const { state, cookie } = createState(USER)
    expect(checkState(cookie, state, USER)).toBe(true)
  })

  it("rejects another user, another state, or a missing cookie", () => {
    const { state, cookie } = createState(USER)
    expect(
      checkState(cookie, state, "22222222-2222-2222-2222-222222222222"),
    ).toBe(false)
    expect(checkState(cookie, createState(USER).state, USER)).toBe(false)
    expect(checkState(undefined, state, USER)).toBe(false)
    expect(checkState(cookie, null, USER)).toBe(false)
    expect(checkState("no-dot", state, USER)).toBe(false)
  })

  it("issues a fresh, unguessable state every time", () => {
    const a = createState(USER).state
    const b = createState(USER).state
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(32)
  })

  it("builds AniList's authorize URL", () => {
    const url = new URL(
      authorizeUrl("123", "http://localhost:3000/auth/anilist/callback", "abc"),
    )
    expect(url.origin + url.pathname).toBe(
      "https://anilist.co/api/v2/oauth/authorize",
    )
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "123",
      redirect_uri: "http://localhost:3000/auth/anilist/callback",
      response_type: "code",
      state: "abc",
    })
  })
})
