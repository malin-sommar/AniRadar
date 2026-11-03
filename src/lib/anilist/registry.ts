import type { ResultOf, VariablesOf } from "@graphql-typed-document-node/core"
import { z } from "zod"

import {
  CACHE_POLICIES,
  type CacheClass,
  type CachePolicy,
} from "./cache-policy"
import {
  TrendingAnimeDocument,
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
}

function defineOperation<TData, TVariables>(
  definition: OperationDefinition<TData, TVariables>,
) {
  return definition
}

const page = z.int().min(1).max(500).nullish()
const perPage = z.int().min(1).max(50).nullish()
/** `false` hides adult entries; `null` shows everything (opt-in setting). */
const isAdult = z.boolean().nullish()

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

/** What the request core needs: the operation name and its query text. */
export function documentFor(name: OperationName) {
  return { operationName: name, query: operations[name].document.toString() }
}
