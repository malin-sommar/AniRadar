import type {
  CharacterEdgeFragment,
  CharacterRole,
} from "@/lib/anilist/gql/graphql"

export type CharacterEdge = CharacterEdgeFragment
export type VoiceActor = NonNullable<
  NonNullable<CharacterEdge["voiceActors"]>[number]
>

export const ROLE_LABELS: Record<CharacterRole, string> = {
  MAIN: "Main",
  SUPPORTING: "Supporting",
  BACKGROUND: "Background",
}

/** The most relevant Japanese and English voice actor for a character. */
export function pickVoiceActors(voiceActors: CharacterEdge["voiceActors"]): {
  japanese?: VoiceActor
  english?: VoiceActor
} {
  const all = (voiceActors ?? []).filter(
    (actor): actor is VoiceActor => actor !== null,
  )
  return {
    japanese: all.find((actor) => actor.languageV2 === "Japanese"),
    english: all.find((actor) => actor.languageV2 === "English"),
  }
}
