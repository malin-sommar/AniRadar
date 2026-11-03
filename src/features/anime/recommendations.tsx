"use client"

import { AnimeCard, CardGrid } from "@/components/anime/anime-card"
import { usePreferences } from "@/hooks/use-preferences"
import type { MediaCardFragment } from "@/lib/anilist/gql/graphql"

import { DetailSection } from "./section"

/** AniList's top-rated user recommendations (12 fill 2, 3, 4 and 6 columns). */
export function Recommendations({ media }: { media: MediaCardFragment[] }) {
  const { showAdult } = usePreferences()
  const visible = media.filter((item) => showAdult || !item.isAdult)
  if (visible.length === 0) return null

  return (
    <DetailSection id="recommendations-title" title="If you like this">
      <CardGrid>
        {visible.map((item) => (
          <AnimeCard key={item.id} media={item} />
        ))}
      </CardGrid>
    </DetailSection>
  )
}
