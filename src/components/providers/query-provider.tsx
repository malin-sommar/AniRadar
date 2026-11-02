"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { useState, type ReactNode } from "react"

import { createQueryPersister } from "@/lib/query/persister"
import { PERSIST_MAX_AGE_MS, getQueryClient } from "@/lib/query/query-client"

// Changes whenever the GraphQL operations change (see next.config.ts), so
// data saved in an older shape is discarded instead of rendered.
const CACHE_BUSTER = process.env.NEXT_PUBLIC_QUERY_CACHE_BUSTER ?? "dev"

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const [persister] = useState(() =>
    typeof window === "undefined" ? undefined : createQueryPersister(),
  )

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && query.meta?.persist === true,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
