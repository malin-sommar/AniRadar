import { describe, expect, it } from "vitest"

import {
  countdownTickMs,
  formatLiveCountdown,
  upcomingEpisodes,
} from "./airing"

describe("upcomingEpisodes", () => {
  it("drops aired episodes and sorts the rest", () => {
    const schedule = [
      { episode: 6, airingAt: 3000 },
      null,
      { episode: 4, airingAt: 1000 },
      { episode: 5, airingAt: 2000 },
    ]
    expect(
      upcomingEpisodes(schedule, 1500).map((item) => item.episode),
    ).toEqual([5, 6])
    expect(upcomingEpisodes(null, 0)).toEqual([])
  })
})

describe("formatLiveCountdown", () => {
  it("shows days and hours, then hours and minutes", () => {
    expect(formatLiveCountdown(2 * 86_400 + 4 * 3600 + 120)).toBe("2d 4h")
    expect(formatLiveCountdown(4 * 3600 + 12 * 60 + 5)).toBe("4h 12m")
  })

  it("ticks in minutes and seconds during the last hour", () => {
    expect(formatLiveCountdown(12 * 60 + 5)).toBe("12:05")
    expect(formatLiveCountdown(9)).toBe("00:09")
    expect(formatLiveCountdown(0)).toBe("now")
  })

  it("redraws every second only in the last hour", () => {
    expect(countdownTickMs(3599)).toBe(1000)
    expect(countdownTickMs(7200)).toBe(30_000)
  })
})
