"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ArrowRightIcon, LoaderCircleIcon, SearchIcon } from "lucide-react"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { CoverImage } from "@/components/anime/cover-image"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { EMPTY_FILTERS, toBrowseVariables } from "@/domain/browse"
import { formatLabel, mediaMeta } from "@/domain/media"
import {
  groupIntoSeries,
  seriesCountLabel,
  yearsLabel,
  type SeriesGroup,
} from "@/domain/series"
import {
  fetchBrowsePage,
  type BrowseMedia,
} from "@/features/browse/fetch-browse-page"
import { browseSearchHref } from "@/features/browse/search-params"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useDisplayTitle, usePreferences } from "@/hooks/use-preferences"
import { CACHE_POLICIES } from "@/lib/anilist/cache-policy"
import { aniListQueryKey } from "@/lib/anilist/query-keys"

const MAX_RESULTS = 8
const MIN_SEARCH_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 250

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  )
}

/**
 * The header's search: a pill on desktop, an icon on phones. Opens with
 * "/" or Ctrl/⌘ K from any page and shows the top matches as you type.
 */
export function SearchOverlay() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcut =
        (event.key === "/" && !isTyping(event.target)) ||
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))
      if (!shortcut) return
      event.preventDefault()
      setOpen(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-64 items-center gap-2 rounded-full border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none md:flex"
      >
        <SearchIcon className="size-4" aria-hidden="true" />
        Search anime…
        <kbd className="ml-auto rounded border bg-background px-1.5 font-sans text-[11px]">
          /
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon-lg"
        className="size-10 rounded-full md:hidden"
        aria-label="Search anime"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-5" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search anime"
        description="Type a title in English, romaji or Japanese."
        className="top-3 max-w-[calc(100%-1.5rem)] sm:top-[12vh] sm:max-w-xl"
      >
        {open ? <SearchPanel onDone={() => setOpen(false)} /> : null}
      </CommandDialog>
    </>
  )
}

function SearchPanel({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const preferences = usePreferences()
  const [term, setTerm] = useState("")
  const search = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS)
  const enabled = search.length >= MIN_SEARCH_LENGTH

  const variables = toBrowseVariables(
    { ...EMPTY_FILTERS, search },
    preferences,
    MAX_RESULTS,
  )
  // Same lookup as the browse page's first page (partial words included),
  // grouped into series and trimmed to the top matches.
  const { data, isFetching, isError } = useQuery({
    queryKey: [...aniListQueryKey("BrowseAnime", variables), "overlay"],
    queryFn: ({ signal }) => fetchBrowsePage(variables, 1, signal),
    staleTime: CACHE_POLICIES.browse.freshSeconds * 1000,
    enabled,
    placeholderData: keepPreviousData,
  })
  const results = enabled
    ? groupIntoSeries(data?.media ?? []).slice(0, MAX_RESULTS)
    : []
  const typing = term.trim() !== search
  const busy = enabled && (isFetching || typing)

  // Highlight the top match whenever a new set of results arrives, rather
  // than whichever row happened to be highlighted before.
  const firstValue = results[0] ? `anime-${results[0].first.id}` : "see-all"
  const [highlighted, setHighlighted] = useState(firstValue)
  const [lastFirst, setLastFirst] = useState(firstValue)
  if (firstValue !== lastFirst) {
    setLastFirst(firstValue)
    setHighlighted(firstValue)
  }

  function go(href: string) {
    onDone()
    router.push(href as Route)
  }

  let message: string | undefined
  if (term.trim().length < MIN_SEARCH_LENGTH) {
    message = "Type at least two letters to search."
  } else if (isError && results.length === 0) {
    message = "Couldn't search right now. AniList may be busy."
  } else if (!busy && results.length === 0) {
    message = "No anime found."
  }

  return (
    <Command
      shouldFilter={false}
      label="Search anime"
      loop
      value={highlighted}
      onValueChange={setHighlighted}
    >
      <div className="relative">
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder="Search anime…"
          maxLength={100}
          className="h-10 text-base"
        />
        {busy ? (
          <LoaderCircleIcon
            className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <CommandList className="max-h-[min(70vh,32rem)]">
        {message ? (
          <p
            role="status"
            className="px-3 py-6 text-center text-sm text-muted-foreground"
          >
            {message}
          </p>
        ) : null}
        {results.length > 0 ? (
          <CommandGroup heading="Anime">
            {results.map((group) => (
              <SearchResult
                key={group.first.id}
                group={group}
                onSelect={() => go(`/anime/${group.first.id}`)}
              />
            ))}
          </CommandGroup>
        ) : null}
        {term.trim().length >= MIN_SEARCH_LENGTH ? (
          <CommandGroup>
            <CommandItem
              value="see-all"
              onSelect={() => go(browseSearchHref(term))}
            >
              <SearchIcon aria-hidden="true" />
              <span>
                See all results for{" "}
                <span className="font-medium">“{term.trim()}”</span>
              </span>
              <ArrowRightIcon className="ml-auto" aria-hidden="true" />
            </CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  )
}

function SearchResult({
  group,
  onSelect,
}: {
  group: SeriesGroup<BrowseMedia>
  onSelect: () => void
}) {
  const media = group.first
  const title = useDisplayTitle(media.title)
  const continues = useDisplayTitle(group.continues?.title)
  const count = seriesCountLabel(group)
  const meta = count
    ? [formatLabel(media.format), count, yearsLabel(group.years)]
        .filter(Boolean)
        .join(" · ")
    : mediaMeta(media)
  const isAdult = group.members.some((item) => item.isAdult)
  return (
    <CommandItem
      value={`anime-${media.id}`}
      onSelect={onSelect}
      className="gap-3"
    >
      <CoverImage
        cover={media.coverImage}
        alt=""
        sizes="40px"
        className="w-10 shrink-0 rounded-md"
      />
      <span className="min-w-0">
        <span className="line-clamp-2 font-medium">{title}</span>
        {meta ? (
          <span className="block text-xs text-muted-foreground">{meta}</span>
        ) : null}
        {group.continues ? (
          <span className="block text-xs text-muted-foreground">
            Continues {continues}
          </span>
        ) : null}
      </span>
      {isAdult ? (
        <span className="ml-auto shrink-0 rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-background">
          18+
        </span>
      ) : null}
    </CommandItem>
  )
}
