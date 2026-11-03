"use client"

import {
  seriesCountLabel,
  yearsLabel,
  type SeriesGroup,
  type SeriesItem,
} from "@/domain/series"
import type { MediaCardFragment } from "@/lib/anilist/gql/graphql"

import { AnimeCard } from "./anime-card"

/**
 * One card for a whole series (PLAN.md §10.0): its first season's cover
 * and title, how many seasons, and the next episode of any of them. A lone
 * sequel says which season it continues.
 */
export function SeriesCard<T extends MediaCardFragment & SeriesItem>({
  group,
  priority,
}: {
  group: SeriesGroup<T>
  priority?: boolean
}) {
  const count = seriesCountLabel(group)
  return (
    <AnimeCard
      media={group.first}
      priority={priority}
      series={{
        count,
        years: count ? yearsLabel(group.years) : undefined,
        airing: group.airing?.nextAiringEpisode,
        continues: group.continues?.title,
        isAdult: group.members.some((item) => item.isAdult),
      }}
    />
  )
}
