import { z } from "zod"

/**
 * Display and content settings, saved on this device. Phase 3 moves them to
 * the signed-in profile so they follow you between devices.
 */

export const PREFERENCES_STORAGE_KEY = "aniradar-preferences"

const preferencesSchema = z.object({
  titleLanguage: z.enum(["english", "romaji", "native"]).catch("english"),
  /** Off until the user confirms they're 18 or older. */
  showAdult: z.boolean().catch(false),
})

export type Preferences = z.infer<typeof preferencesSchema>

export const DEFAULT_PREFERENCES: Preferences = Object.freeze({
  titleLanguage: "english",
  showAdult: false,
})

/** Parses a stored value; anything invalid falls back to the defaults. */
export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES
  try {
    const parsed = preferencesSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}
