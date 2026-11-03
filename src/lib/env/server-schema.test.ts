import { describe, expect, it } from "vitest"

import { parseServerEnv } from "./server-schema"

describe("parseServerEnv", () => {
  it("fills in safe defaults", () => {
    expect(parseServerEnv({})).toMatchObject({
      ANILIST_API_URL: "https://graphql.anilist.co",
      ANILIST_REQUESTS_PER_MINUTE: 25,
      ANILIST_MAX_REQUESTS_PER_MINUTE: 76,
      ANILIST_TIMEOUT_MS: 10_000,
      JIKAN_API_URL: "https://api.jikan.moe/v4",
      JIKAN_TIMEOUT_MS: 4000,
      KITSU_API_URL: "https://kitsu.io/api/edge",
      KITSU_TIMEOUT_MS: 3000,
    })
  })

  it("leaves accounts off when their variables are missing", () => {
    const env = parseServerEnv({})
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined()
    expect(env.ANILIST_TOKEN_KEY).toBeUndefined()
  })

  it("rejects a token key that isn't 32 bytes", () => {
    expect(() =>
      parseServerEnv({
        ANILIST_TOKEN_KEY: Buffer.alloc(16).toString("base64"),
      }),
    ).toThrow(/ANILIST_TOKEN_KEY/)
    expect(
      parseServerEnv({ ANILIST_TOKEN_KEY: Buffer.alloc(32).toString("base64") })
        .ANILIST_TOKEN_KEY,
    ).toBeDefined()
  })

  it("treats empty values as unset", () => {
    expect(
      parseServerEnv({ ANILIST_API_URL: "", ANILIST_REQUESTS_PER_MINUTE: "" }),
    ).toMatchObject({
      ANILIST_API_URL: "https://graphql.anilist.co",
      ANILIST_REQUESTS_PER_MINUTE: 25,
    })
  })

  it("parses numbers from strings", () => {
    expect(
      parseServerEnv({ ANILIST_REQUESTS_PER_MINUTE: "10" })
        .ANILIST_REQUESTS_PER_MINUTE,
    ).toBe(10)
  })

  it("names every invalid variable in one error", () => {
    expect(() =>
      parseServerEnv({
        ANILIST_API_URL: "not a url",
        ANILIST_REQUESTS_PER_MINUTE: "5000",
      }),
    ).toThrow(
      /ANILIST_API_URL[\s\S]*ANILIST_REQUESTS_PER_MINUTE|ANILIST_REQUESTS_PER_MINUTE[\s\S]*ANILIST_API_URL/,
    )
  })
})
