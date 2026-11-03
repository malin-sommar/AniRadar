import { describe, expect, it } from "vitest"

import { DEFAULT_PREFERENCES, parsePreferences } from "./preferences"

describe("parsePreferences", () => {
  it("starts with English titles and adult content off", () => {
    expect(parsePreferences(null)).toEqual({
      titleLanguage: "english",
      showAdult: false,
    })
  })

  it("reads saved settings", () => {
    expect(
      parsePreferences(
        JSON.stringify({ titleLanguage: "romaji", showAdult: true }),
      ),
    ).toEqual({ titleLanguage: "romaji", showAdult: true })
  })

  it("falls back per setting when a value is invalid", () => {
    expect(
      parsePreferences(
        JSON.stringify({ titleLanguage: "klingon", showAdult: "yes" }),
      ),
    ).toEqual(DEFAULT_PREFERENCES)
    expect(
      parsePreferences(JSON.stringify({ titleLanguage: "native" })),
    ).toEqual({ titleLanguage: "native", showAdult: false })
  })

  it("ignores data that isn't JSON", () => {
    expect(parsePreferences("{oops")).toEqual(DEFAULT_PREFERENCES)
  })
})
