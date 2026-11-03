import "server-only"

import sanitizeHtml from "sanitize-html"

/*
 * AniList descriptions are user-submitted HTML. They're cleaned on the
 * server, so the sanitizer never ships to the browser.
 */

const DESCRIPTION_OPTIONS: sanitizeHtml.IOptions = {
  // span only so spoiler spans can be recognised and dropped below.
  allowedTags: ["p", "br", "i", "em", "b", "strong", "a", "span"],
  // target and rel are set by transformTags below, overriding any given.
  allowedAttributes: { a: ["href", "target", "rel"], span: ["class"] },
  allowedClasses: { span: ["markdown_spoiler"] },
  allowedSchemes: ["https"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    }),
  },
  // Spoilers are hidden on AniList; leave them out here.
  exclusiveFilter: (frame) =>
    frame.tag === "span" &&
    /\bmarkdown_spoiler\b/.test(frame.attribs.class ?? ""),
}

/** A description reduced to paragraphs, line breaks, emphasis and links. */
export function sanitizeDescription(html: string | null | undefined): string {
  if (!html) return ""
  return sanitizeHtml(html, DESCRIPTION_OPTIONS).trim()
}

/** Plain text for link previews, cut at a word boundary. */
export function descriptionText(
  html: string | null | undefined,
  maxLength = 200,
): string {
  if (!html) return ""
  const text = sanitizeHtml(html.replace(/<br\s*\/?>/gi, " "), {
    allowedTags: [],
    allowedAttributes: {},
    exclusiveFilter: DESCRIPTION_OPTIONS.exclusiveFilter,
  })
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength - 1)
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`
}
