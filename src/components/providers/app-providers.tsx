"use client"

import { SerwistProvider } from "@serwist/turbopack/react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"

import { QueryProvider } from "./query-provider"

const SERVICE_WORKER_OPTIONS: RegistrationOptions = {
  scope: "/",
  type: "classic",
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      // A service worker in development serves stale files; test it with
      // a production build (`pnpm build && pnpm start`).
      disable={process.env.NODE_ENV === "development"}
      options={SERVICE_WORKER_OPTIONS}
      // Phase 8 decides what gets cached; until then, cache nothing extra.
      cacheOnNavigation={false}
      reloadOnOnline={false}
    >
      <NuqsAdapter>
        <QueryProvider>{children}</QueryProvider>
      </NuqsAdapter>
    </SerwistProvider>
  )
}
