"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ROLE_LABELS,
  pickVoiceActors,
  type CharacterEdge,
  type VoiceActor,
} from "@/domain/characters"
import { isPresent } from "@/domain/media"
import { usePreferences } from "@/hooks/use-preferences"
import { fetchAniList } from "@/lib/anilist/browser"
import { aniListQueryKey } from "@/lib/anilist/query-keys"
import { cachePolicyFor } from "@/lib/anilist/registry"
import { imageSrc } from "@/lib/images"
import { cn } from "@/lib/utils"

import { DetailSection } from "./section"

const PAGE_SIZE = 25

/**
 * Main characters first, each with their Japanese and English voice actor.
 * "Show all" loads the rest page by page.
 */
export function CharactersSection({
  animeId,
  initial,
  hasMore,
}: {
  animeId: number
  initial: CharacterEdge[]
  hasMore: boolean
}) {
  const policy = cachePolicyFor("AnimeCharacters")
  const all = useInfiniteQuery({
    queryKey: [
      ...aniListQueryKey("AnimeCharacters", {
        id: animeId,
        perPage: PAGE_SIZE,
      }),
      "pages",
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchAniList(
        "AnimeCharacters",
        { id: animeId, page: pageParam, perPage: PAGE_SIZE },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const info = last.Media?.characters?.pageInfo
      return info?.hasNextPage ? (info.currentPage ?? 0) + 1 : undefined
    },
    staleTime: policy.freshSeconds * 1000,
    enabled: false,
  })

  const loaded = all.data?.pages
    .flatMap((page) => page.Media?.characters?.edges ?? [])
    .filter(isPresent)
  const characters = loaded ?? initial
  const canLoadMore = loaded ? all.hasNextPage : hasMore
  const loading = all.isFetching

  return (
    <DetailSection id="characters-title" title="Characters & voice actors">
      <ul className="grid gap-3 md:grid-cols-2">
        {characters.map((edge, index) => (
          <CharacterRow
            key={edge.id ?? `${edge.node?.id}-${index}`}
            edge={edge}
          />
        ))}
      </ul>
      {canLoadMore || all.isError ? (
        <div className="flex flex-col items-center gap-2">
          {all.isError ? (
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load more characters. AniList may be busy.
            </p>
          ) : null}
          <Button
            variant="secondary"
            className="rounded-full"
            disabled={loading}
            onClick={() => (loaded ? all.fetchNextPage() : all.refetch())}
          >
            {loading ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {loading
              ? "Loading…"
              : loaded
                ? "Show more characters"
                : "Show all characters"}
          </Button>
        </div>
      ) : null}
    </DetailSection>
  )
}

function CharacterRow({ edge }: { edge: CharacterEdge }) {
  const { titleLanguage } = usePreferences()
  const { japanese, english } = pickVoiceActors(edge.voiceActors)
  const character = edge.node
  const name =
    (titleLanguage === "native" ? character?.name?.native : null) ??
    character?.name?.full ??
    "Unknown"

  return (
    <li className="flex items-stretch justify-between gap-3 overflow-hidden rounded-2xl border bg-card">
      <div className="flex min-w-0 items-center gap-3">
        <Portrait src={character?.image?.medium ?? character?.image?.large} />
        <div className="min-w-0 py-2">
          <p className="line-clamp-2 text-sm font-medium">{name}</p>
          {edge.role ? (
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[edge.role]}
            </p>
          ) : null}
        </div>
      </div>
      {japanese || english ? (
        <div className="flex shrink-0 flex-col justify-center gap-1.5 py-2 pr-3 text-right">
          {japanese ? <VoiceActorLine actor={japanese} language="JP" /> : null}
          {english ? <VoiceActorLine actor={english} language="EN" /> : null}
        </div>
      ) : null}
    </li>
  )
}

function VoiceActorLine({
  actor,
  language,
}: {
  actor: VoiceActor
  language: "JP" | "EN"
}) {
  const { titleLanguage } = usePreferences()
  const name =
    (titleLanguage === "native" ? actor.name?.native : null) ??
    actor.name?.full ??
    "Unknown"
  return (
    <p className="flex items-center justify-end gap-2 text-xs">
      <span className="max-w-32 truncate sm:max-w-40">{name}</span>
      <abbr
        title={language === "JP" ? "Japanese" : "English"}
        className="rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground no-underline"
      >
        {language}
      </abbr>
    </p>
  )
}

function Portrait({
  src,
  className,
}: {
  src?: string | null
  className?: string
}) {
  const url = imageSrc(src)
  return (
    <div
      className={cn("h-20 w-14 shrink-0 bg-muted", className)}
      aria-hidden="true"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : null}
    </div>
  )
}
