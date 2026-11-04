/*
 * AniList names streaming sites inconsistently ("Amazon Prime Video" and
 * "Prime Video", "Disney Plus" and "Disney+"). Services get one name each
 * (PLAN.md §10.4); sites we don't recognize keep their own.
 */

const ALIASES: Record<string, string> = {
  "amazon prime video": "Prime Video",
  amazon: "Prime Video",
  "prime video": "Prime Video",
  "disney plus": "Disney+",
  "disney+": "Disney+",
  hidive: "HIDIVE",
  "hbo max": "Max",
  max: "Max",
  "bilibili tv": "Bilibili",
  bilibili: "Bilibili",
  "tubi tv": "Tubi",
  tubi: "Tubi",
  iq: "iQIYI",
  iqiyi: "iQIYI",
  crunchyroll: "Crunchyroll",
  netflix: "Netflix",
  hulu: "Hulu",
  youtube: "YouTube",
}

/** Services offered under "My services" in settings, most common first. */
export const KNOWN_SERVICES = [
  "Crunchyroll",
  "Netflix",
  "Prime Video",
  "Disney+",
  "HIDIVE",
  "Hulu",
  "Max",
  "YouTube",
  "Bilibili",
  "iQIYI",
  "Tubi",
] as const

export function normalizeService(site: string): string {
  const name = site.trim()
  return ALIASES[name.toLowerCase()] ?? name
}

/** The distinct streaming services among AniList's links. */
export function streamingServices(
  links:
    | ReadonlyArray<{
        site: string
        type: string | null
        isDisabled: boolean | null
      } | null>
    | null
    | undefined,
): string[] {
  const services = new Set<string>()
  for (const link of links ?? []) {
    if (link?.type === "STREAMING" && !link.isDisabled) {
      services.add(normalizeService(link.site))
    }
  }
  return [...services].sort((a, b) => a.localeCompare(b))
}
