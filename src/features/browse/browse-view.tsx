"use client"

import { SearchIcon, XIcon } from "lucide-react"
import { useQueryStates } from "nuqs"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  FORMATS,
  FORMAT_FILTER_LABELS,
  SEASONS,
  SEASON_LABELS,
  SORT_LABELS,
  STATUSES,
  STATUS_LABELS,
  activeFilters,
  effectiveSort,
  groupTags,
  removeFilter,
  sanitizeFilters,
  sortOptions,
  toBrowseVariables,
  visibleGenres,
  yearOptions,
  type BrowseFilters,
  type Taxonomy,
} from "@/domain/browse"
import { isPresent } from "@/domain/media"
import { usePreferences } from "@/hooks/use-preferences"
import { useAniListQuery } from "@/lib/anilist/hooks"
import type { OperationData } from "@/lib/anilist/registry"

import { BrowseResults } from "./browse-results"
import { FilterPopover } from "./filter-popover"
import { browseParsers, browseUrlKeys } from "./search-params"

const SEARCH_DEBOUNCE_MS = 400

function toTaxonomy(
  data: OperationData<"GenresAndTags"> | undefined,
): Taxonomy | undefined {
  if (!data) return undefined
  return {
    genres: (data.GenreCollection ?? []).filter(isPresent),
    tags: (data.MediaTagCollection ?? []).filter(isPresent),
  }
}

type FilterChanges = Partial<{
  [K in keyof BrowseFilters]: BrowseFilters[K] | null
}>

/** The browse page: search text, filters and sort live in the URL. */
export function BrowseView() {
  const [params, setParams] = useQueryStates(browseParsers, {
    urlKeys: browseUrlKeys,
    // Filter changes replace the URL, so Back leaves the page instead of
    // stepping through every tweak, and returns to the same filters later.
    history: "replace",
    scroll: false,
  })
  const preferences = usePreferences()
  const { data: taxonomyData } = useAniListQuery("GenresAndTags", {})
  const taxonomy = toTaxonomy(taxonomyData)
  const filters = sanitizeFilters(params, {
    taxonomy,
    showAdult: preferences.showAdult,
  })

  function update(changes: FilterChanges) {
    void setParams(changes)
  }

  const genreOptions = visibleGenres(
    taxonomy?.genres ?? [],
    preferences.showAdult,
  ).map((genre) => ({ value: genre, label: genre }))
  const tagGroups = groupTags(taxonomy?.tags ?? [], preferences.showAdult).map(
    (group) => ({
      heading: group.category,
      options: group.tags.map((tag) => ({ value: tag.name, label: tag.name })),
    }),
  )
  const chips = activeFilters(filters)
  const sort = effectiveSort(filters)

  return (
    <div className="space-y-4">
      <SearchField
        value={filters.search}
        onCommit={(search) => update({ search: search || null })}
      />

      <div
        role="group"
        aria-label="Filters"
        className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        <FilterPopover
          label="Genres"
          multiple
          groups={[{ options: genreOptions }]}
          selected={filters.genres}
          onChange={(genres) => update({ genres })}
        />
        <FilterPopover
          label="Tags"
          multiple
          searchPlaceholder="Search tags…"
          groups={tagGroups}
          selected={filters.tags}
          onChange={(tags) => update({ tags })}
        />
        <FilterPopover
          label="Season"
          groups={[
            {
              options: SEASONS.map((season) => ({
                value: season,
                label: SEASON_LABELS[season],
              })),
            },
          ]}
          selected={filters.season ? [filters.season] : []}
          onChange={([season]) =>
            update({ season: SEASONS.find((s) => s === season) ?? null })
          }
        />
        <FilterPopover
          label="Year"
          searchPlaceholder="Type a year…"
          groups={[
            {
              options: yearOptions().map((year) => ({
                value: String(year),
                label: String(year),
              })),
            },
          ]}
          selected={filters.year !== null ? [String(filters.year)] : []}
          onChange={([year]) => update({ year: year ? Number(year) : null })}
        />
        <FilterPopover
          label="Format"
          multiple
          groups={[
            {
              options: FORMATS.map((format) => ({
                value: format,
                label: FORMAT_FILTER_LABELS[format],
              })),
            },
          ]}
          selected={filters.formats}
          onChange={(values) =>
            update({ formats: FORMATS.filter((f) => values.includes(f)) })
          }
        />
        <FilterPopover
          label="Status"
          multiple
          groups={[
            {
              options: STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
              })),
            },
          ]}
          selected={filters.statuses}
          onChange={(values) =>
            update({ statuses: STATUSES.filter((s) => values.includes(s)) })
          }
        />
        <FilterPopover
          label="Sort"
          summary={`Sort: ${SORT_LABELS[sort]}`}
          clearable={false}
          groups={[
            {
              options: sortOptions(filters).map((option) => ({
                value: option,
                label: SORT_LABELS[option],
              })),
            },
          ]}
          selected={[sort]}
          onChange={([value]) =>
            update({ sort: sortOptions(filters).find((s) => s === value) })
          }
          className="sm:ml-auto"
        />
      </div>

      {chips.length > 0 ? (
        <ul aria-label="Active filters" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={`${chip.key}:${chip.value}`}>
              <button
                type="button"
                onClick={() => update(removeFilter(filters, chip))}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-primary/12 pr-2 pl-3 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
              >
                {chip.label}
                <XIcon className="size-3.5" aria-hidden="true" />
                <span className="sr-only">Remove filter</span>
              </button>
            </li>
          ))}
          {chips.length > 1 ? (
            <li>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full text-xs"
                onClick={() => update(CLEARED_FILTERS)}
              >
                Clear all
              </Button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <BrowseResults
        variables={toBrowseVariables(filters, preferences)}
        hasFilters={chips.length > 0 || filters.search.length > 0}
        onClearFilters={() => update({ ...CLEARED_FILTERS, search: null })}
      />
    </div>
  )
}

/** Clears every filter but keeps the search text and sort. */
const CLEARED_FILTERS: FilterChanges = {
  genres: null,
  tags: null,
  season: null,
  year: null,
  formats: null,
  statuses: null,
}

/**
 * Search text, sent to the URL (and AniList) after a short pause in
 * typing, or straight away on Enter.
 */
function SearchField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)

  // The URL changed from elsewhere (Clear, the search overlay, Back):
  // show its value.
  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  function commit(next: string) {
    const trimmed = next.trim()
    if (trimmed === synced) return
    setSynced(trimmed)
    onCommit(trimmed)
  }

  useEffect(() => {
    if (draft.trim() === synced) return
    const timer = setTimeout(() => commit(draft), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  })

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        commit(draft)
      }}
      className="relative"
    >
      <label htmlFor="browse-search" className="sr-only">
        Search anime
      </label>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        id="browse-search"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
        placeholder="Search anime…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-12 w-full rounded-full border bg-muted/40 pr-12 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
          onClick={() => {
            setDraft("")
            commit("")
          }}
        >
          <XIcon />
        </Button>
      ) : null}
    </form>
  )
}
