import { describe, expect, it } from "vitest"

import { parseAnimeId, parseTrailer, streamingLinks } from "./detail"

describe("parseTrailer", () => {
  it("builds the no-cookie embed for YouTube, trimming stray whitespace", () => {
    expect(parseTrailer({ id: "LHtdKWJdif4\t", site: "youtube" })).toEqual({
      site: "youtube",
      id: "LHtdKWJdif4",
      watchUrl: "https://www.youtube.com/watch?v=LHtdKWJdif4",
      embedUrl:
        "https://www.youtube-nocookie.com/embed/LHtdKWJdif4?autoplay=1&rel=0",
      thumbnail: "https://i.ytimg.com/vi/LHtdKWJdif4/hqdefault.jpg",
    })
  })

  it("links out to Dailymotion without embedding", () => {
    const trailer = parseTrailer({ id: "x7tgad0", site: "dailymotion" })
    expect(trailer?.watchUrl).toBe("https://www.dailymotion.com/video/x7tgad0")
    expect(trailer?.embedUrl).toBeUndefined()
  })

  it("ignores unknown sites and suspicious IDs", () => {
    expect(parseTrailer({ id: "abc123", site: "vimeo" })).toBeNull()
    expect(parseTrailer({ id: "../x?y", site: "youtube" })).toBeNull()
    expect(parseTrailer(null)).toBeNull()
  })
})

describe("streamingLinks", () => {
  const link = (changes: object) => ({
    id: 1,
    site: "Crunchyroll",
    url: "https://www.crunchyroll.com/series/x",
    type: "STREAMING",
    language: null,
    color: "#F88B24",
    icon: null,
    isDisabled: false,
    ...changes,
  })

  it("keeps working streaming links once each", () => {
    const result = streamingLinks([
      link({}),
      link({ id: 2 }),
      link({ id: 3, site: "Netflix", language: "Japanese" }),
      link({ id: 4, type: "INFO", site: "Official Site" }),
      link({ id: 5, site: "HIDIVE", isDisabled: true }),
      null,
    ])
    expect(result.map((item) => item.site)).toEqual(["Crunchyroll", "Netflix"])
  })

  it("upgrades http links, drops other schemes and non-hex colours", () => {
    expect(streamingLinks([link({ url: "http://x.test/a" })])[0]?.url).toBe(
      "https://x.test/a",
    )
    expect(streamingLinks([link({ url: "javascript:alert(1)" })])).toEqual([])
    expect(
      streamingLinks([link({ color: "red;background:url(x)" })])[0]?.color,
    ).toBeNull()
  })
})

describe("parseAnimeId", () => {
  it("accepts AniList IDs only", () => {
    expect(parseAnimeId("16498")).toBe(16498)
    expect(parseAnimeId("0")).toBeNull()
    expect(parseAnimeId("12abc")).toBeNull()
    expect(parseAnimeId("123456789")).toBeNull()
  })
})
