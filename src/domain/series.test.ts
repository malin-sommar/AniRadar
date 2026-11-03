import { describe, expect, it } from "vitest"

import search from "../../tests/fixtures/anilist/BrowseAnime-search-attack-on-titan.json"
import popular from "../../tests/fixtures/anilist/BrowseAnime.json"
import {
  groupIntoSeries,
  mainStoryLabel,
  seriesCountLabel,
  yearsLabel,
  type SeriesItem,
} from "./series"

const title = (item: {
  title: { english: string | null; romaji: string | null } | null
}) => item.title?.english ?? item.title?.romaji

type Recorded = SeriesItem & {
  title: { english: string | null; romaji: string | null } | null
}

const searchResults = search.data.Page.media as unknown as Recorded[]

describe("groupIntoSeries", () => {
  it("turns a search for one franchise into one card per series", () => {
    const groups = groupIntoSeries(searchResults)
    // 20 results: the main series (9 entries), the recap films (3), the
    // chibi shorts (3) and five stand-alone entries.
    expect(groups).toHaveLength(8)

    const main = groups[0]!
    expect(title(main.first)).toBe("Attack on Titan")
    expect(main.members).toHaveLength(9)
    expect(main.seasons).toBe(6)
    expect(main.years).toEqual([2013, 2023])
    expect(main.continues).toBeNull()
  })

  it("keeps spin-offs and alternative versions as their own series", () => {
    const groups = groupIntoSeries(searchResults)
    const juniorHigh = groups.find(
      (group) => title(group.first) === "Attack on Titan: Junior High",
    )
    expect(juniorHigh?.members).toHaveLength(1)
    const films = groups.find(
      (group) =>
        title(group.first) === "Attack on Titan Part I: Crimson Bow and Arrow",
    )
    expect(films?.seasons).toBe(3)
  })

  it("keeps the ranking: a series sits where its best result was", () => {
    const groups = groupIntoSeries(searchResults)
    const firsts = groups.map((group) => title(group.first))
    expect(firsts.indexOf("Attack on Titan")).toBe(0)
    expect(firsts.indexOf("Attack on Titan OVA")).toBeLessThan(
      firsts.indexOf("Attack on Titan: Junior High"),
    )
  })

  it("labels a lone sequel with the season it continues", () => {
    const finalSeason = searchResults.find((item) => item.id === 110277)!
    const [group] = groupIntoSeries([finalSeason])
    expect(group?.first.id).toBe(110277)
    expect(group?.continues?.id).toBe(104578)
    expect(group?.continues?.title?.english).toBe(
      "Attack on Titan Season 3 Part 2",
    )
  })

  it("joins seasons that arrive on a later page", () => {
    const pageOne = searchResults.slice(0, 10)
    const both = searchResults
    expect(groupIntoSeries(pageOne)[0]?.members.length).toBeLessThan(
      groupIntoSeries(both)[0]?.members.length ?? 0,
    )
  })

  it("picks the soonest airing season for the badge", () => {
    const a = {
      ...searchResults[0]!,
      nextAiringEpisode: { airingAt: 500, episode: 3 },
    }
    const b = {
      ...searchResults.find((item) => item.id === 20958)!,
      nextAiringEpisode: { airingAt: 200, episode: 7 },
    }
    expect(groupIntoSeries([a, b])[0]?.airing?.id).toBe(20958)
  })

  it("leaves unrelated popular shows alone", () => {
    const media = popular.data.Page.media as unknown as Recorded[]
    const groups = groupIntoSeries(media)
    expect(groups.length).toBeLessThan(media.length)
    for (const group of groups) {
      const ids = new Set(group.members.map((item) => item.id))
      expect(ids.size).toBe(group.members.length)
    }
  })
})

describe("count labels", () => {
  it("counts seasons and films separately", () => {
    expect(mainStoryLabel(["TV", "TV", "ONA"])).toBe("3 seasons")
    expect(mainStoryLabel(["MOVIE", "MOVIE"])).toBe("2 films")
    expect(mainStoryLabel(["TV", "MOVIE", "TV", "OVA"])).toBe(
      "2 seasons · 1 film",
    )
    expect(mainStoryLabel(["TV", "OVA"])).toBeUndefined()
  })

  it("falls back to entries for groups without a main story", () => {
    const groups = groupIntoSeries(searchResults)
    const labels = groups.map(seriesCountLabel)
    expect(labels[0]).toBe("6 seasons")
    expect(labels).toContain("3 films")
    expect(labels).toContain("3 entries")
  })
})

describe("yearsLabel", () => {
  it("shows a range or a single year", () => {
    expect(yearsLabel([2013, 2023])).toBe("2013–2023")
    expect(yearsLabel([2020, 2020])).toBe("2020")
    expect(yearsLabel(null)).toBeUndefined()
  })
})
