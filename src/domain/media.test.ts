import { describe, expect, it } from "vitest"

import { displayTitle, formatCountdown, formatLabel, mediaMeta } from "./media"

describe("displayTitle", () => {
  const title = {
    english: "Attack on Titan",
    romaji: "Shingeki no Kyojin",
    native: "進撃の巨人",
  }

  it("uses the preferred language", () => {
    expect(displayTitle(title)).toBe("Attack on Titan")
    expect(displayTitle(title, "romaji")).toBe("Shingeki no Kyojin")
    expect(displayTitle(title, "native")).toBe("進撃の巨人")
  })

  it("falls back when the preferred title is missing or blank", () => {
    expect(displayTitle({ ...title, english: null })).toBe("Shingeki no Kyojin")
    expect(displayTitle({ ...title, english: "  " })).toBe("Shingeki no Kyojin")
    expect(
      displayTitle({ english: null, romaji: null, native: "進撃の巨人" }),
    ).toBe("進撃の巨人")
  })

  it("never returns an empty string", () => {
    expect(displayTitle(null)).toBe("Untitled")
    expect(displayTitle({ english: null, romaji: null, native: null })).toBe(
      "Untitled",
    )
  })
})

describe("mediaMeta", () => {
  it("joins format, episode count and year", () => {
    expect(mediaMeta({ format: "TV", episodes: 12, seasonYear: 2026 })).toBe(
      "TV · 12 eps · 2026",
    )
    expect(mediaMeta({ format: "OVA", episodes: 1, seasonYear: null })).toBe(
      "OVA · 1 ep",
    )
  })

  it("skips unknown parts and the obvious '1 ep' on movies", () => {
    expect(mediaMeta({ format: "MOVIE", episodes: 1, seasonYear: 2016 })).toBe(
      "Movie · 2016",
    )
    expect(mediaMeta({ format: null, episodes: null, seasonYear: null })).toBe(
      "",
    )
  })

  it("labels formats for people", () => {
    expect(formatLabel("TV_SHORT")).toBe("TV Short")
    expect(formatLabel(null)).toBeUndefined()
  })
})

describe("formatCountdown", () => {
  it.each([
    [-5, "now"],
    [0, "now"],
    [30, "in 1m"],
    [59 * 60, "in 59m"],
    [60 * 60, "in 1h"],
    [23 * 3600 + 59 * 60, "in 23h"],
    [24 * 3600, "in 1d"],
    [6 * 86400 + 3600, "in 6d"],
  ])("%i seconds → %s", (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected)
  })
})
