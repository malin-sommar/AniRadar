"use client"

import { useQuery } from "@tanstack/react-query"
import {
  LinkIcon,
  ListVideoIcon,
  LogInIcon,
  RefreshCwIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useQueryStates } from "nuqs"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LIST_SORTS,
  LIST_SORT_LABELS,
  LIST_TABS,
  LIST_TAB_LABELS,
  buildSeriesRows,
  inTab,
  matchesSearch,
  onServices,
  serviceCounts,
  sortRows,
  tabCounts,
} from "@/domain/my-list"
import { FilterPopover } from "@/features/browse/filter-popover"
import { useHydrated } from "@/hooks/use-hydrated"
import { useNow } from "@/hooks/use-now"
import { usePreferences } from "@/hooks/use-preferences"
import { cn } from "@/lib/utils"

import { listParsers, listUrlKeys } from "./search-params"
import { SeriesRowCard } from "./series-row"
import type { MyListResponse } from "./types"

export const MY_LIST_QUERY_KEY = ["me", "list"] as const

async function fetchMyList(signal: AbortSignal): Promise<MyListResponse> {
  const response = await fetch("/api/me/list", {
    headers: { Accept: "application/json" },
    signal,
  })
  const body = (await response.json()) as MyListResponse
  // Keep showing the saved list while AniList is busy.
  if (body.status === "busy") throw new Error("AniList is busy")
  return body
}

/**
 * Your AniList list, one row per series (PLAN.md §10.3). Fetched fresh
 * when the page opens or you come back to it, and saved on this device for
 * instant loads and offline use.
 */
export function ListView() {
  const query = useQuery({
    queryKey: MY_LIST_QUERY_KEY,
    queryFn: ({ signal }) => fetchMyList(signal),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    meta: { persist: true },
  })

  // The saved list can be ready before hydration; the server rendered the
  // skeleton, so show that first.
  const hydrated = useHydrated()
  if (query.isPending || !hydrated) return <ListSkeleton />
  const data = query.data
  if (!data) {
    return (
      <EmptyState
        icon={TriangleAlertIcon}
        title="Couldn't load your list"
        description="AniList may be busy right now. Try again in a minute."
        className="mt-6"
      >
        <Button variant="secondary" onClick={() => query.refetch()}>
          <RefreshCwIcon />
          Try again
        </Button>
      </EmptyState>
    )
  }

  switch (data.status) {
    case "signed-out":
      return (
        <EmptyState
          icon={LogInIcon}
          title="Sign in to see your list"
          description="Sign in, then connect your AniList account: your list shows up here, grouped by series."
          className="mt-6"
        >
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </EmptyState>
      )
    case "not-connected":
    case "expired":
      return (
        <EmptyState
          icon={LinkIcon}
          title={
            data.status === "expired"
              ? "Reconnect AniList"
              : "Connect your AniList"
          }
          description={
            data.status === "expired"
              ? "AniList no longer accepts AniRadar's access (it expired or was revoked). Reconnect to see your list."
              : "Your list lives on AniList. Connect your account to see it here."
          }
          className="mt-6"
        >
          <Button asChild>
            {/* A full navigation: the route redirects to AniList. */}
            <a href="/auth/anilist/start">
              {data.status === "expired"
                ? "Reconnect AniList"
                : "Connect AniList"}
            </a>
          </Button>
        </EmptyState>
      )
    case "unavailable":
      return (
        <EmptyState
          icon={ListVideoIcon}
          title="Your list isn't available here"
          description="Accounts aren't set up on this server yet."
          className="mt-6"
        />
      )
    case "ok":
      return (
        <ListContent
          data={data}
          stale={query.isError}
          refreshing={query.isFetching}
        />
      )
  }
}

function ListContent({
  data,
  stale,
  refreshing,
}: {
  data: Extract<MyListResponse, { status: "ok" }>
  stale: boolean
  refreshing: boolean
}) {
  const [params, setParams] = useQueryStates(listParsers, {
    urlKeys: listUrlKeys,
    history: "replace",
    scroll: false,
  })
  const now = useNow()
  const { titleLanguage } = usePreferences()
  const nowSeconds = Math.floor((now ?? data.fetchedAt) / 1000)

  const all = buildSeriesRows(data.entries, nowSeconds)
  const counts = tabCounts(all)
  const services = params.mine ? data.myServices : params.services
  const searched = all.filter(
    (row) => matchesSearch(row, params.search) && onServices(row, services),
  )
  const rows = sortRows(
    searched.filter((row) => inTab(row, params.tab)),
    params.sort,
    titleLanguage,
  )
  const chips = serviceCounts(all).slice(0, 8)

  if (all.length === 0) {
    return (
      <EmptyState
        icon={ListVideoIcon}
        title="Your list is empty"
        description="Find something to watch in Browse. Adding shows from AniRadar comes next."
        className="mt-6"
      >
        <Button asChild variant="secondary">
          <Link href="/browse">Browse anime</Link>
        </Button>
      </EmptyState>
    )
  }

  return (
    <div className="space-y-4">
      {stale ? (
        <p role="status" className="rounded-2xl bg-muted p-3 text-sm">
          AniList is busy: showing your list as it was last loaded.
        </p>
      ) : null}

      <div
        role="group"
        aria-label="Status"
        className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {LIST_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={params.tab === tab}
            onClick={() => void setParams({ tab })}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
              params.tab === tab
                ? "border-transparent bg-primary text-primary-foreground"
                : "bg-card hover:bg-accent",
            )}
          >
            {LIST_TAB_LABELS[tab]}
            <span
              className={cn(
                "text-xs",
                params.tab === tab
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <label htmlFor="list-search" className="sr-only">
            Search your list
          </label>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="list-search"
            type="search"
            value={params.search}
            onChange={(event) =>
              void setParams({ search: event.target.value || null })
            }
            placeholder="Search your list…"
            className="h-9 w-full rounded-full border bg-muted/40 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <FilterPopover
          label="Sort"
          summary={`Sort: ${LIST_SORT_LABELS[params.sort]}`}
          clearable={false}
          groups={[
            {
              options: LIST_SORTS.map((sort) => ({
                value: sort,
                label: LIST_SORT_LABELS[sort],
              })),
            },
          ]}
          selected={[params.sort]}
          onChange={([value]) =>
            void setParams({ sort: LIST_SORTS.find((s) => s === value) })
          }
        />
      </div>

      {chips.length > 0 ? (
        <div
          role="group"
          aria-label="Streaming services"
          className="flex flex-wrap gap-2"
        >
          {data.myServices.length > 0 ? (
            <ServiceChip
              label="On my services"
              pressed={params.mine}
              onClick={() =>
                void setParams({ mine: !params.mine || null, services: null })
              }
            />
          ) : null}
          {chips.map(([service, count]) => (
            <ServiceChip
              key={service}
              label={service}
              count={count}
              pressed={!params.mine && params.services.includes(service)}
              onClick={() =>
                void setParams({
                  mine: null,
                  services: params.services.includes(service)
                    ? params.services.filter((s) => s !== service)
                    : [...params.services, service],
                })
              }
            />
          ))}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {`${rows.length} series${refreshing ? ", updating" : ""}`}
      </p>
      {rows.length > 0 ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <SeriesRowCard key={row.id} row={row} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing here{params.search ? ` matches “${params.search}”` : ""}.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        From your AniList list. Streaming availability varies by region.
      </p>
    </div>
  )
}

function ServiceChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string
  count?: number
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
        pressed ? "border-primary bg-primary/15" : "bg-card hover:bg-accent",
      )}
    >
      {label}
      {count !== undefined ? (
        <span className="text-muted-foreground">{count}</span>
      ) : null}
    </button>
  )
}

export function ListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your list">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-9 rounded-full" />
      <div className="grid gap-2 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
