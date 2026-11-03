import { describe, expect, it } from "vitest"

import aot from "../../tests/fixtures/anilist/franchises/attack-on-titan.json"
import monogatari from "../../tests/fixtures/anilist/franchises/monogatari.json"
import {
  compareStartDates,
  formatStartDate,
  groupSeasons,
  walkSeasonChain,
  type SeasonItem,
} from "./seasons"

interface Franchise {
  startId: number
  items: unknown[]
}

/** Serves SeasonChain batches from a recorded franchise, counting requests. */
function franchise(fixture: Franchise) {
  const items = new Map(
    (fixture.items as SeasonItem[]).map((item) => [item.id, item]),
  )
  const batches: number[][] = []
  return {
    item: (id: number) => items.get(id) as SeasonItem,
    batches,
    fetchBatch: async (ids: number[]) => {
      batches.push(ids)
      return ids.flatMap((id) => items.get(id) ?? [])
    },
  }
}

const title = (node: {
  title: { english: string | null; romaji: string | null } | null
}) => node.title?.english ?? node.title?.romaji

async function seasonsFrom(fixture: Franchise, startId = fixture.startId) {
  const source = franchise(fixture)
  const result = await walkSeasonChain(source.item(startId), source.fetchBatch)
  return { ...result, groups: groupSeasons(result.graph, startId), source }
}

describe("walkSeasonChain + groupSeasons", () => {
  it("orders Attack on Titan's seasons by start date", async () => {
    const { groups, truncated, requests } = await seasonsFrom(aot)
    expect(groups.main.map(title)).toEqual([
      "Attack on Titan",
      "Attack on Titan Season 2",
      "Attack on Titan Season 3",
      "Attack on Titan Season 3 Part 2",
      "Attack on Titan Final Season",
      "Attack on Titan Final Season Part 2",
    ])
    expect(truncated).toBe(false)
    // Two steps per request: six seasons and specials need at most four.
    expect(requests).toBeLessThanOrEqual(4)
  })

  it("finds the same order from a season in the middle", async () => {
    const { groups } = await seasonsFrom(aot, 99147)
    expect(groups.main).toHaveLength(6)
    expect(title(groups.main[0]!)).toBe("Attack on Titan")
  })

  it("puts OVAs, specials and side stories in their own group", async () => {
    const { groups } = await seasonsFrom(aot)
    const side = groups.side.map((entry) => title(entry.node))
    expect(side).toContain("Attack on Titan: No Regrets")
    expect(side).toContain(
      "Attack on Titan Final Season THE FINAL CHAPTERS Special 1",
    )
    expect(side).toContain("Attack on Titan: Junior High")
    expect(groups.side.find((entry) => entry.node.id === 20811)?.relation).toBe(
      null,
    )
  })

  it("links the source material", async () => {
    const { groups } = await seasonsFrom(aot)
    expect(groups.source.map((entry) => entry.node.type)).toEqual(["MANGA"])
    expect(groups.source[0]?.relation).toBe("SOURCE")
  })

  it("orders a branching franchise (Monogatari), movies included", async () => {
    const { groups, truncated } = await seasonsFrom(monogatari)
    const main = groups.main.map(title)
    expect(main[0]).toBe("Bakemonogatari")
    expect(main).toContain("Kizumonogatari Part 1: Tekketsu")
    expect(main.indexOf("Nisemonogatari")).toBeLessThan(
      main.indexOf("Nekomonogatari Black"),
    )
    expect(main.indexOf("Kizumonogatari Part 1: Tekketsu")).toBeLessThan(
      main.indexOf("Kizumonogatari Part 2: Nekketsu"),
    )
    expect(truncated).toBe(false)
  })

  it("stops after the request limit and says so", async () => {
    const source = franchise(monogatari)
    const result = await walkSeasonChain(
      source.item(monogatari.startId),
      source.fetchBatch,
      { maxRequests: 1 },
    )
    expect(result.requests).toBe(1)
    expect(result.truncated).toBe(true)
  })

  it("keeps what it found when a request fails", async () => {
    const source = franchise(aot)
    const result = await walkSeasonChain(source.item(aot.startId), async () => {
      throw new Error("AniList is down")
    })
    expect(result.truncated).toBe(true)
    expect(groupSeasons(result.graph, aot.startId).main).toHaveLength(2)
  })

  it("treats entries AniList doesn't return as dead ends", async () => {
    const source = franchise(aot)
    let calls = 0
    const result = await walkSeasonChain(source.item(aot.startId), async () => {
      calls++
      return []
    })
    expect(result.truncated).toBe(false)
    expect(calls).toBe(1)
    // The start's own relations still give its direct neighbours.
    expect(groupSeasons(result.graph, aot.startId).main.map(title)).toEqual([
      "Attack on Titan",
      "Attack on Titan Season 2",
    ])
  })
})

describe("dates", () => {
  const node = (year: number | null, month: number | null = null, id = 1) =>
    ({
      id,
      startDate: { year, month, day: null },
      seasonYear: null,
    }) as Parameters<typeof compareStartDates>[0]

  it("sorts unknown dates last", () => {
    const sorted = [node(null, null, 1), node(2020, 5, 2), node(2020, null, 3)]
      .sort(compareStartDates)
      .map((item) => item.id)
    expect(sorted).toEqual([2, 3, 1])
  })

  it("formats upcoming dates as precisely as they're known", () => {
    expect(formatStartDate(node(2027, 1))).toBe("Jan 2027")
    expect(formatStartDate(node(2027))).toBe("2027")
    expect(formatStartDate(node(null))).toBe("TBA")
  })
})
