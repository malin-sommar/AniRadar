import type { OperationVariables } from "@/lib/anilist/registry"

/** 1 hero + a 24-card grid, which fills 2, 3, 4 and 6 columns evenly. */
export const TRENDING_VARIABLES = {
  page: 1,
  perPage: 25,
  isAdult: false,
} satisfies OperationVariables<"TrendingAnime">
