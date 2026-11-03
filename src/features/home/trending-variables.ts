import { adultFilter } from "@/domain/browse"
import type { OperationVariables } from "@/lib/anilist/registry"

/** 1 hero + a 24-card grid, which fills 2, 3, 4 and 6 columns evenly. */
export const TRENDING_VARIABLES = {
  page: 1,
  perPage: 25,
  isAdult: false,
} satisfies OperationVariables<"TrendingAnime">

/**
 * The server prefetches the default (no adult entries); with adult content
 * switched on, the browser asks for the unfiltered list instead.
 */
export function trendingVariables(showAdult: boolean) {
  return showAdult
    ? { ...TRENDING_VARIABLES, isAdult: adultFilter(true) }
    : TRENDING_VARIABLES
}
