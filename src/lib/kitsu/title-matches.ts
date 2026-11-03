import { z } from "zod"

/*
 * AniList's own search only matches whole words ("juju" doesn't find
 * "Jujutsu Kaisen"). Kitsu's search matches partial words, and its results
 * carry AniList IDs, so we use it to find which shows the text could mean.
 * Only the IDs are used; the shows themselves still come from AniList.
 */

/** Most matches one lookup returns (Kitsu's page size limit). */
export const MAX_TITLE_MATCHES = 20

const kitsuSearchSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      relationships: z
        .object({
          mappings: z
            .object({
              data: z
                .array(z.object({ type: z.string(), id: z.string() }))
                .nullish(),
            })
            .nullish(),
        })
        .nullish(),
    }),
  ),
  included: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        attributes: z
          .object({
            externalSite: z.string().nullish(),
            externalId: z.string().nullish(),
          })
          .nullish(),
      }),
    )
    .nullish(),
})

/**
 * AniList IDs from a Kitsu anime search, in Kitsu's ranking order. Shows
 * Kitsu hasn't mapped to AniList are skipped (AniList's own search may
 * still find them).
 */
export function aniListIdsFromKitsu(body: unknown): number[] {
  const parsed = kitsuSearchSchema.parse(body)
  const aniListIdByMapping = new Map<string, number>()
  for (const item of parsed.included ?? []) {
    if (item.type !== "mappings") continue
    if (item.attributes?.externalSite !== "anilist/anime") continue
    const id = Number(item.attributes.externalId)
    if (Number.isSafeInteger(id) && id > 0) aniListIdByMapping.set(item.id, id)
  }

  const ids: number[] = []
  for (const anime of parsed.data) {
    const mappings = anime.relationships?.mappings?.data ?? []
    const id = mappings
      .map((mapping) => aniListIdByMapping.get(mapping.id))
      .find((value) => value !== undefined)
    if (id !== undefined && !ids.includes(id)) ids.push(id)
  }
  return ids.slice(0, MAX_TITLE_MATCHES)
}

/** Lowercased, trimmed and single-spaced, so equal searches share a cache entry. */
export function normalizeSearchText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase()
}

/** Query string for Kitsu's anime search with AniList mappings included. */
export function kitsuSearchParams(text: string): URLSearchParams {
  return new URLSearchParams({
    "filter[text]": text,
    "page[limit]": String(MAX_TITLE_MATCHES),
    include: "mappings",
    "fields[anime]": "mappings",
    "fields[mappings]": "externalSite,externalId",
  })
}
