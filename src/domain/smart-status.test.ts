import { describe, expect, it } from "vitest"

import type { MediaListStatus } from "@/lib/anilist/gql/graphql"

import {
  airedEpisodes,
  smartStatus,
  type Sequel,
  type SmartEntry,
} from "./smart-status"

const NOW = 1_800_000_000
const HOUR = 3600

function entry(
  changes: Partial<Omit<SmartEntry, "media">> & {
    media?: Partial<SmartEntry["media"]>
  },
): SmartEntry {
  return {
    mediaId: 1,
    status: "CURRENT",
    progress: 0,
    sequels: [],
    ...changes,
    media: {
      status: "RELEASING",
      episodes: 12,
      nextAiringEpisode: null,
      ...changes.media,
    },
  }
}

function sequel(changes: Partial<Sequel> = {}): Sequel {
  return {
    id: 2,
    format: "TV",
    status: "NOT_YET_RELEASED",
    startDate: { year: 2027, month: 1 },
    title: { english: "Season 2", romaji: null, native: null },
    ...changes,
  }
}

function status(value: SmartEntry, list: [number, MediaListStatus][] = []) {
  return smartStatus(value, { nowSeconds: NOW, listStatus: new Map(list) })
}

const nextEp = (episode: number, inHours: number) => ({
  episode,
  airingAt: NOW + inHours * HOUR,
})

describe("smart status (PLAN.md §10.3)", () => {
  it.each([
    [
      "caught up on an airing show → Awaiting the next episode",
      entry({ progress: 8, media: { nextAiringEpisode: nextEp(9, 5) } }),
      "awaiting",
    ],
    [
      "behind on an airing show → Watching",
      entry({ progress: 6, media: { nextAiringEpisode: nextEp(9, 5) } }),
      "watching",
    ],
    [
      "on hiatus with an unknown schedule → Watching (nothing guessed)",
      entry({ progress: 8, media: { status: "HIATUS" } }),
      "watching",
    ],
    [
      "finished show, last episode watched → Completed (auto)",
      entry({ progress: 12, media: { status: "FINISHED" } }),
      "completed",
    ],
    [
      "finished show, not done → Watching",
      entry({ progress: 5, media: { status: "FINISHED" } }),
      "watching",
    ],
    ["Want to watch stays", entry({ status: "PLANNING" }), "planning"],
    ["Paused stays", entry({ status: "PAUSED" }), "paused"],
    ["Dropped stays", entry({ status: "DROPPED" }), "dropped"],
  ])("%s", (_label, value, expected) => {
    expect(status(value).display).toBe(expected)
  })

  it("names the episode it's waiting for", () => {
    const result = status(
      entry({ progress: 8, media: { nextAiringEpisode: nextEp(9, 5) } }),
    )
    expect(result.reason).toEqual({
      kind: "episode",
      episode: 9,
      airingAt: NOW + 5 * HOUR,
    })
  })

  it("counts an episode as aired once its time has passed", () => {
    expect(
      airedEpisodes(
        { status: "RELEASING", episodes: 12, nextAiringEpisode: nextEp(9, -1) },
        NOW,
      ),
    ).toBe(9)
    expect(
      airedEpisodes(
        { status: "RELEASING", episodes: null, nextAiringEpisode: null },
        NOW,
      ),
    ).toBeNull()
  })

  it("marks rewatching and keeps it Watching", () => {
    const result = status(
      entry({
        status: "REPEATING",
        progress: 3,
        media: { status: "FINISHED" },
      }),
    )
    expect(result).toMatchObject({ display: "watching", rewatching: true })
  })

  it("only auto-completes finished shows", () => {
    expect(
      status(entry({ progress: 12, media: { status: "FINISHED" } }))
        .autoComplete,
    ).toBe(true)
    expect(status(entry({ progress: 12 })).autoComplete).toBeUndefined()
  })

  describe("completed shows and their sequels", () => {
    it("Awaiting when a sequel is announced and not on your list", () => {
      const result = status(entry({ status: "COMPLETED", sequels: [sequel()] }))
      expect(result.display).toBe("awaiting")
      expect(result.reason).toMatchObject({ kind: "sequel", sequel: { id: 2 } })
    })

    it("still Awaiting when the sequel is only in Want to watch", () => {
      expect(
        status(entry({ status: "COMPLETED", sequels: [sequel()] }), [
          [2, "PLANNING"],
        ]).display,
      ).toBe("awaiting")
    })

    it("Completed when you've started the sequel already", () => {
      expect(
        status(entry({ status: "COMPLETED", sequels: [sequel()] }), [
          [2, "CURRENT"],
        ]),
      ).toEqual({ display: "completed", rewatching: false })
    })

    it("Completed again once the sequel airs, noting it's out", () => {
      const result = status(
        entry({
          status: "COMPLETED",
          sequels: [sequel({ status: "RELEASING" })],
        }),
      )
      expect(result.display).toBe("completed")
      expect(result.reason?.kind).toBe("sequel-out")
    })

    it("ignores side stories in other formats and picks the earliest sequel", () => {
      const result = status(
        entry({
          status: "COMPLETED",
          sequels: [
            sequel({
              id: 3,
              format: "OVA",
              startDate: { year: 2026, month: 1 },
            }),
            sequel({ id: 4, startDate: { year: 2028, month: null } }),
            sequel({
              id: 5,
              format: "MOVIE",
              startDate: { year: 2027, month: 6 },
            }),
          ],
        }),
      )
      expect(result.reason).toMatchObject({ kind: "sequel", sequel: { id: 5 } })
    })
  })
})
