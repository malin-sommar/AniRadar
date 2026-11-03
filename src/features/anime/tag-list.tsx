"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { serializeBrowse } from "@/features/browse/search-params"
import { usePreferences } from "@/hooks/use-preferences"
import { cn } from "@/lib/utils"

import { DetailSection } from "./section"

interface Tag {
  id: number
  name: string
  rank: number | null
  isGeneralSpoiler: boolean | null
  isMediaSpoiler: boolean | null
  isAdult: boolean | null
}

/**
 * Tags by relevance. Spoiler tags stay hidden until asked for, and adult
 * tags only appear when adult content is on.
 */
export function TagList({ tags }: { tags: Tag[] }) {
  const { showAdult } = usePreferences()
  const [showSpoilers, setShowSpoilers] = useState(false)

  const visible = tags
    .filter((tag) => showAdult || !tag.isAdult)
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
  const isSpoiler = (tag: Tag) => tag.isGeneralSpoiler || tag.isMediaSpoiler
  const spoilers = visible.filter(isSpoiler).length
  const shown = showSpoilers
    ? visible
    : visible.filter((tag) => !isSpoiler(tag))

  if (visible.length === 0) return null

  return (
    <DetailSection
      id="tags-title"
      title="Tags"
      action={
        spoilers > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            aria-pressed={showSpoilers}
            onClick={() => setShowSpoilers(!showSpoilers)}
          >
            {showSpoilers ? <EyeOffIcon /> : <EyeIcon />}
            {showSpoilers
              ? "Hide spoilers"
              : `${spoilers} spoiler ${spoilers === 1 ? "tag" : "tags"}`}
          </Button>
        ) : undefined
      }
    >
      <ul className="flex flex-wrap gap-2">
        {shown.map((tag) => (
          <li key={tag.id}>
            <Link
              href={serializeBrowse("/browse", { tags: [tag.name] }) as Route}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-sm transition-colors hover:bg-accent",
                isSpoiler(tag) && "border-destructive/60 text-destructive",
              )}
            >
              {tag.name}
              {tag.rank ? (
                <span className="text-xs text-muted-foreground">
                  {tag.rank}%
                </span>
              ) : null}
              {isSpoiler(tag) ? (
                <span className="sr-only">(spoiler)</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </DetailSection>
  )
}
