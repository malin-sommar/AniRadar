import type { ResultOf, VariablesOf } from "@graphql-typed-document-node/core"
import { z } from "zod"

import {
  CACHE_POLICIES,
  type CacheClass,
  type CachePolicy,
} from "./cache-policy"
import {
  AnimeCharactersDocument,
  AnimeDetailDocument,
  BrowseAnimeDocument,
  GenresAndTagsDocument,
  SearchAnimeDocument,
  SeasonChainDocument,
  TrendingAnimeDocument,
  type AnimeCharactersQuery,
  type AnimeCharactersQueryVariables,
  type AnimeDetailQuery,
  type AnimeDetailQueryVariables,
  type BrowseAnimeQuery,
  type BrowseAnimeQueryVariables,
  type GenresAndTagsQuery,
  type GenresAndTagsQueryVariables,
  type SearchAnimeQuery,
  type SearchAnimeQueryVariables,
  type SeasonChainQuery,
  type SeasonChainQueryVariables,
  type TrendingAnimeQuery,
  type TrendingAnimeQueryVariables,
  type TypedDocumentString,
} from "./gql/graphql"

export interface OperationDefinition<TData, TVariables> {
  name: string
  document: TypedDocumentString<TData, TVariables>
  /** Validates variables arriving at the proxy. Strict: unknown keys are rejected. */
  variables: z.ZodType<TVariables>
  cache: CacheClass
  /** Picks a different cache class from the response, e.g. shorter for airing shows. */
  cacheFor?: (data: TData) => CacheClass
}

function defineOperation<TData, TVariables>(
  definition: OperationDefinition<TData, TVariables>,
) {
  return definition
}

const page = z.int().min(1).max(500).nullish()
const mediaId = z.int().min(1).max(10_000_000)
const perPage = z.int().min(1).max(50).nullish()
/**
 * `false` hides adult entries; leaving it out shows everything (opt-in
 * setting). `null` is rejected: AniList answers it with no results at all.
 */
const isAdult = z.boolean().optional()
/** Genre or tag names; AniList's longest is well under 50 characters. */
const terms = z.array(z.string().min(1).max(50)).min(1).max(10).nullish()

const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA"] as const
const STATUSES = [
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "HIATUS",
] as const
/** The sorts the browse page offers (see `src/domain/browse.ts`). */
const SORTS = [
  "SEARCH_MATCH",
  "POPULARITY_DESC",
  "SCORE_DESC",
  "TRENDING_DESC",
  "START_DATE_DESC",
  "TITLE_ENGLISH",
  "TITLE_ROMAJI",
  "TITLE_NATIVE",
] as const

/** Filters shared by browse and search. */
const filters = {
  page,
  perPage,
  genres: terms,
  tags: terms,
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]).nullish(),
  seasonYear: z.int().min(1940).max(2100).nullish(),
  formats: z.array(z.enum(FORMATS)).min(1).max(FORMATS.length).nullish(),
  statuses: z.array(z.enum(STATUSES)).min(1).max(STATUSES.length).nullish(),
  sort: z.array(z.enum(SORTS)).min(1).max(2).nullish(),
  isAdult,
}
const searchText = z.string().trim().min(1).max(100)

/**
 * Every AniList operation the app may run. The browser proxy rejects
 * anything that isn't listed here.
 */
export const operations = {
  TrendingAnime: defineOperation<
    TrendingAnimeQuery,
    TrendingAnimeQueryVariables
  >({
    name: "TrendingAnime",
    document: TrendingAnimeDocument,
    variables: z.strictObject({ page, perPage, isAdult }),
    cache: "trending",
  }),
  BrowseAnime: defineOperation<BrowseAnimeQuery, BrowseAnimeQueryVariables>({
    name: "BrowseAnime",
    document: BrowseAnimeDocument,
    variables: z.strictObject({ ...filters, search: searchText.nullish() }),
    cache: "browse",
  }),
  SearchAnime: defineOperation<SearchAnimeQuery, SearchAnimeQueryVariables>({
    name: "SearchAnime",
    document: SearchAnimeDocument,
    variables: z.strictObject({
      ...filters,
      search: searchText,
      /** AniList IDs from the partial-word title lookup (lib/kitsu). */
      ids: z.array(z.int().min(1)).min(1).max(20),
      matchSort: z
        .array(z.enum(SORTS).exclude(["SEARCH_MATCH"]))
        .min(1)
        .max(2)
        .nullish(),
    }),
    cache: "browse",
  }),
  GenresAndTags: defineOperation<
    GenresAndTagsQuery,
    GenresAndTagsQueryVariables
  >({
    name: "GenresAndTags",
    document: GenresAndTagsDocument,
    variables: z.strictObject({}),
    cache: "static",
  }),
  AnimeDetail: defineOperation<AnimeDetailQuery, AnimeDetailQueryVariables>({
    name: "AnimeDetail",
    document: AnimeDetailDocument,
    variables: z.strictObject({ id: mediaId }),
    cache: "detail",
    // The countdown and episode schedule must stay fresh while a show airs.
    cacheFor: (data) =>
      data.Media?.status === "RELEASING" || data.Media?.nextAiringEpisode
        ? "airing"
        : "detail",
  }),
  SeasonChain: defineOperation<SeasonChainQuery, SeasonChainQueryVariables>({
    name: "SeasonChain",
    document: SeasonChainDocument,
    variables: z.strictObject({ ids: z.array(mediaId).min(1).max(50) }),
    cache: "relations",
  }),
  AnimeCharacters: defineOperation<
    AnimeCharactersQuery,
    AnimeCharactersQueryVariables
  >({
    name: "AnimeCharacters",
    document: AnimeCharactersDocument,
    variables: z.strictObject({ id: mediaId, page, perPage }),
    cache: "relations",
  }),
}

export type OperationName = keyof typeof operations

type DocumentOf<N extends OperationName> = (typeof operations)[N]["document"]

export type OperationData<N extends OperationName> = ResultOf<DocumentOf<N>>

export type OperationVariables<N extends OperationName> = VariablesOf<
  DocumentOf<N>
>

export function isOperationName(name: string): name is OperationName {
  return Object.hasOwn(operations, name)
}

export function cachePolicyFor(name: OperationName): CachePolicy {
  return CACHE_POLICIES[operations[name].cache]
}

/** The cache policy for one response (see `cacheFor`). */
export function cachePolicyForData<N extends OperationName>(
  name: N,
  data: OperationData<N>,
): CachePolicy {
  // Each entry's `cacheFor` takes its own data type; TypeScript can't link
  // the two through the name, hence the narrow cast.
  const { cache, cacheFor } = operations[name] as {
    cache: CacheClass
    cacheFor?: (data: OperationData<N>) => CacheClass
  }
  return CACHE_POLICIES[cacheFor?.(data) ?? cache]
}

/** What the request core needs: the operation name and its query text. */
export function documentFor(name: OperationName) {
  return { operationName: name, query: operations[name].document.toString() }
}
