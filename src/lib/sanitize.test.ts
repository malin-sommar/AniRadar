import { describe, expect, it } from "vitest"

import { descriptionText, sanitizeDescription } from "./sanitize"

describe("sanitizeDescription", () => {
  it("keeps paragraphs, breaks and emphasis", () => {
    expect(
      sanitizeDescription("<p>A <i>quiet</i> <b>story</b>.<br>Second line</p>"),
    ).toBe("<p>A <i>quiet</i> <b>story</b>.<br />Second line</p>")
  })

  it("removes scripts, styles, event handlers and unsafe links", () => {
    const html = sanitizeDescription(
      `<p onclick="x()">Hi<script>alert(1)</script><img src=x onerror=y>` +
        `<a href="javascript:alert(1)">bad</a><a href="http://x.test">plain</a></p>`,
    )
    expect(html).not.toMatch(/script|onclick|onerror|img|javascript|http:/)
  })

  it("opens safe links in a new tab without a referrer", () => {
    expect(
      sanitizeDescription('<a href="https://anilist.co/anime/1">AniList</a>'),
    ).toBe(
      '<a href="https://anilist.co/anime/1" target="_blank" rel="noopener noreferrer nofollow">AniList</a>',
    )
  })

  it("drops spoilers", () => {
    expect(
      sanitizeDescription(
        'Before <span class="markdown_spoiler"><span>he dies</span></span>after',
      ),
    ).toBe("Before after")
  })

  it("handles a missing description", () => {
    expect(sanitizeDescription(null)).toBe("")
  })
})

describe("descriptionText", () => {
  it("returns plain text for link previews", () => {
    expect(descriptionText("<p>Tom &amp; Jerry<br>are <i>back</i>.</p>")).toBe(
      "Tom & Jerry are back.",
    )
  })

  it("cuts long text at a word boundary", () => {
    const text = descriptionText(`<p>${"word ".repeat(100)}</p>`, 30)
    expect(text.length).toBeLessThanOrEqual(30)
    expect(text.endsWith("word…")).toBe(true)
  })
})
