"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchAniList } from "./browser"
import { aniListQueryKey } from "./query-keys"
import {
  cachePolicyFor,
  type OperationData,
  type OperationName,
  type OperationVariables,
} from "./registry"

/**
 * Typed AniList query with the operation's cache policy applied. Data that
 * a server component prefetched (same key) is used without refetching.
 */
export function useAniListQuery<N extends OperationName>(
  name: N,
  variables: OperationVariables<N>,
  options: { enabled?: boolean } = {},
) {
  const policy = cachePolicyFor(name)
  return useQuery<OperationData<N>>({
    queryKey: aniListQueryKey(name, variables),
    queryFn: ({ signal }) => fetchAniList(name, variables, { signal }),
    staleTime: policy.freshSeconds * 1000,
    meta: { persist: policy.persist },
    ...options,
  })
}
