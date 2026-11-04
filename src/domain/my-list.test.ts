import { describe, expect, it } from "vitest"

import {
  buildSeriesRows,
  inTab,
  matchesSearch,
  onServices,
  progressLabel,
  serviceCounts,
  sortRows,
  tabCounts,
  type ListEntry,
} from "./my-list"
import { normalizeService, streamingServices } from "./streaming"

const NOW = 1_800_000_000

let nextId = 1
function entry(
  changes: Partial<ListEntry> & { title?: string; year?: number },
): ListEntry {
  const id = changes.mediaId ?? nextId++
  return {
    entryId: id * 10,
    mediaId: id,
    seriesId: changes.seriesId ?? id,
    status: "COMPLETED",
    progress: 12,
    score: null,
    repeat: 0,
    updatedAt: 1000,
    sequels: [],
    services: [],
    ...changes,
    media: {
      id,
      title: {
        english: changes.title ?? `Show ${id}`,
        romaji: null,
        native: null,
      },
      coverImage: null,
      format: "TV",
      status: "FINISHED",
      episodes: 12,
      season: null,
      seasonYear: changes.year ?? 2020,
      averageScore: null,
      genres: [],
      isAdult: false,
      nextAiringEpisode: null,
      startDate: { year: changes.year ?? 2020, month: 1, day: 1 },
      ...changes.media,
    },
  }
}

describe("buildSeriesRows", () => {
  it("groups seasons into one row named after the first", () => {
    const rows = buildSeriesRows(
      [
        entry({ mediaId: 2, seriesId: 1, title: "Show S2", year: 2022 }),
        entry({ mediaId: 1, seriesId: 1, title: "Show", year: 2020 }),
        entry({ mediaId: 3, seriesId: 3, title: "Other" }),
      ],
      NOW,
    )
    expect(rows).toHaveLength(2)
    const show = rows.find((row) => row.id === 1)!
    expect(show.first.media.title?.english).toBe("Show")
    expect(show.members.map((m) => m.mediaId)).toEqual([1, 2])
  })

  it("takes the status of the latest season you've started", () => {
    const rows = buildSeriesRows(
      [
        entry({ mediaId: 11, seriesId: 11, year: 2020 }),
        entry({
          mediaId: 12,
          seriesId: 11,
          year: 2022,
          status: "CURRENT",
          progress: 4,
          media: { status: "FINISHED" } as ListEntry["media"],
        }),
        entry({
          mediaId: 13,
          seriesId: 11,
          year: 2024,
          status: "PLANNING",
          progress: 0,
        }),
      ],
      NOW,
    )
    expect(rows[0]?.current.mediaId).toBe(12)
    expect(rows[0]?.smart.display).toBe("watching")
  })

  it("says Awaiting when you've seen everything and a season is announced", () => {
    const [row] = buildSeriesRows(
      [
        entry({
          mediaId: 21,
          sequels: [
            {
              id: 22,
              format: "TV",
              status: "NOT_YET_RELEASED",
              startDate: { year: 2027, month: 1 },
              title: null,
            },
          ],
        }),
      ],
      NOW,
    )
    expect(row?.smart.display).toBe("awaiting")
  })

  it("averages your season scores and finds the next episode", () => {
    const [row] = buildSeriesRows(
      [
        entry({ mediaId: 31, seriesId: 31, score: 8 }),
        entry({
          mediaId: 32,
          seriesId: 31,
          score: 9,
          year: 2021,
          media: {
            nextAiringEpisode: { episode: 3, airingAt: NOW + 100 },
          } as ListEntry["media"],
        }),
      ],
      NOW,
    )
    expect(row?.score).toBe(8.5)
    expect(row?.nextAiringAt).toBe(NOW + 100)
  })
})

describe("tabs, search, services and sorting", () => {
  const rows = buildSeriesRows(
    [
      entry({
        mediaId: 41,
        title: "Frieren",
        status: "PLANNING",
        progress: 0,
        updatedAt: 5,
        services: ["Crunchyroll"],
      }),
      entry({
        mediaId: 42,
        title: "Attack on Titan",
        score: 9,
        updatedAt: 9,
        services: ["Netflix", "Crunchyroll"],
      }),
      entry({
        mediaId: 43,
        title: "Bocchi",
        status: "DROPPED",
        score: 6,
        updatedAt: 1,
      }),
    ],
    NOW,
  )

  it("counts each tab", () => {
    expect(tabCounts(rows)).toMatchObject({
      all: 3,
      planning: 1,
      completed: 1,
      dropped: 1,
      watching: 0,
    })
    expect(rows.filter((row) => inTab(row, "planning"))).toHaveLength(1)
  })

  it("searches every title", () => {
    expect(rows.filter((row) => matchesSearch(row, "TITAN"))).toHaveLength(1)
    expect(rows.filter((row) => matchesSearch(row, " "))).toHaveLength(3)
  })

  it("filters by any of the chosen services", () => {
    expect(rows.filter((row) => onServices(row, ["Netflix"]))).toHaveLength(1)
    expect(
      rows.filter((row) => onServices(row, ["Netflix", "Crunchyroll"])),
    ).toHaveLength(2)
    expect(serviceCounts(rows)).toEqual([
      ["Crunchyroll", 2],
      ["Netflix", 1],
    ])
  })

  it("sorts by last updated, title or score, unscored last", () => {
    const titles = (sort: Parameters<typeof sortRows>[1]) =>
      sortRows(rows, sort, "english").map(
        (row) => row.first.media.title?.english,
      )
    expect(titles("updated")).toEqual(["Attack on Titan", "Frieren", "Bocchi"])
    expect(titles("title")).toEqual(["Attack on Titan", "Bocchi", "Frieren"])
    expect(titles("score")).toEqual(["Attack on Titan", "Bocchi", "Frieren"])
  })

  it("labels progress", () => {
    expect(progressLabel(entry({ status: "CURRENT", progress: 5 }))).toBe(
      "Ep 5 / 12",
    )
    expect(
      progressLabel(entry({ status: "PLANNING", progress: 0 })),
    ).toBeUndefined()
  })
})

describe("streaming services", () => {
  it("gives each service one name", () => {
    expect(normalizeService("Amazon Prime Video")).toBe("Prime Video")
    expect(normalizeService("Disney Plus")).toBe("Disney+")
    expect(normalizeService(" Crunchyroll ")).toBe("Crunchyroll")
    expect(normalizeService("Some New Site")).toBe("Some New Site")
  })

  it("keeps working streaming links only, once each", () => {
    expect(
      streamingServices([
        { site: "Netflix", type: "STREAMING", isDisabled: false },
        { site: "Amazon Prime Video", type: "STREAMING", isDisabled: false },
        { site: "Prime Video", type: "STREAMING", isDisabled: false },
        { site: "Twitter", type: "SOCIAL", isDisabled: false },
        { site: "HIDIVE", type: "STREAMING", isDisabled: true },
        null,
      ]),
    ).toEqual(["Netflix", "Prime Video"])
  })
})
