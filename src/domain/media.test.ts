import { describe, expect, it } from "vitest"

import {
  airedLabel,
  displayTitle,
  episodesLabel,
  formatCountdown,
  formatDuration,
  formatFuzzyDate,
  formatLabel,
  mediaMeta,
  seasonLabel,
  sourceLabel,
} from "./media"

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

describe("detail facts", () => {
  it("describes episodes and their length", () => {
    expect(episodesLabel({ episodes: 12, duration: 24 })).toBe("12 × 24 min")
    expect(episodesLabel({ episodes: 1, duration: 110 })).toBe("1 h 50 min")
    expect(episodesLabel({ episodes: 25, duration: null })).toBe("25 episodes")
    expect(episodesLabel({ episodes: null, duration: 24 })).toBe(
      "24 min per episode",
    )
    expect(episodesLabel({ episodes: null, duration: null })).toBeUndefined()
  })

  it("formats dates as precisely as AniList knows them", () => {
    expect(formatFuzzyDate({ year: 2026, month: 1, day: 7 })).toBe("7 Jan 2026")
    expect(formatFuzzyDate({ year: 2026, month: 1, day: null })).toBe(
      "Jan 2026",
    )
    expect(formatFuzzyDate({ year: 2026, month: null, day: null })).toBe("2026")
    expect(
      formatFuzzyDate({ year: null, month: null, day: null }),
    ).toBeUndefined()
  })

  it("shows the airing period", () => {
    const start = { year: 2026, month: 1, day: 7 }
    const end = { year: 2026, month: 3, day: 25 }
    expect(airedLabel(start, end, "FINISHED")).toBe("7 Jan 2026 – 25 Mar 2026")
    expect(airedLabel(start, null, "RELEASING")).toBe("7 Jan 2026 – now")
    expect(airedLabel(start, start, "FINISHED")).toBe("7 Jan 2026")
  })

  it("names seasons and sources", () => {
    expect(seasonLabel("WINTER", 2026)).toBe("Winter 2026")
    expect(seasonLabel("WINTER", null)).toBeUndefined()
    expect(sourceLabel("LIGHT_NOVEL")).toBe("Light novel")
    expect(formatDuration(60)).toBe("1 h")
  })
})
