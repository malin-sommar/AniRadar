import { QueryClient, isServer } from "@tanstack/react-query"

const DAY_MS = 24 * 60 * 60 * 1000

/** How long persisted data stays usable on the device. */
export const PERSIST_MAX_AGE_MS = 7 * DAY_MS

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** Save this query to IndexedDB (see the operation's cache policy). */
      persist?: boolean
    }
  }
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // At least as long as the persister keeps data, so restored queries
        // aren't thrown away right after a reload.
        gcTime: PERSIST_MAX_AGE_MS,
        // The AniList client already retries transient errors with back-off.
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/** A fresh client per server render; one shared client in the browser. */
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
