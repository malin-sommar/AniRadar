import { describe, expect, it } from "vitest"

import { pickVoiceActors, type VoiceActor } from "./characters"

const actor = (id: number, languageV2: string): VoiceActor => ({
  id,
  languageV2,
  name: { full: `Actor ${id}`, native: null },
  image: null,
})

describe("pickVoiceActors", () => {
  it("picks the first Japanese and English voice actor", () => {
    const picked = pickVoiceActors([
      actor(1, "Korean"),
      actor(2, "Japanese"),
      null,
      actor(3, "English"),
      actor(4, "English"),
    ])
    expect(picked.japanese?.id).toBe(2)
    expect(picked.english?.id).toBe(3)
  })

  it("leaves out languages without a voice actor", () => {
    expect(pickVoiceActors(null)).toEqual({
      japanese: undefined,
      english: undefined,
    })
  })
})
