"use client"

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"

import { aniListQueryKey } from "@/lib/anilist/query-keys"
import { cachePolicyFor } from "@/lib/anilist/registry"

import { fetchBrowsePage, type BrowseVariables } from "./fetch-browse-page"

/**
 * Browse results page by page, for infinite scroll. The previous results
 * stay on screen while new filters load.
 */
export function useBrowsePages(variables: BrowseVariables) {
  const policy = cachePolicyFor("BrowseAnime")
  return useInfiniteQuery({
    queryKey: [...aniListQueryKey("BrowseAnime", variables), "pages"],
    queryFn: ({ pageParam, signal }) =>
      fetchBrowsePage(variables, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: policy.freshSeconds * 1000,
    // A refetch reloads every page in sequence; don't do that on focus.
    refetchOnWindowFocus: false,
    meta: { persist: policy.persist },
    placeholderData: keepPreviousData,
  })
}
