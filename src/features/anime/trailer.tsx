"use client"

import { ExternalLinkIcon, PlayIcon } from "lucide-react"
import { useState } from "react"

import type { Trailer } from "@/domain/detail"
import { imageSrc } from "@/lib/images"

import { DetailSection } from "./section"

/**
 * A YouTube thumbnail that turns into the player only when pressed, so
 * nothing loads from YouTube until then (and the no-cookie player is used).
 * Dailymotion trailers open on Dailymotion.
 */
export function TrailerPlayer({ trailer }: { trailer: Trailer }) {
  const [playing, setPlaying] = useState(false)
  const thumbnail = imageSrc(trailer.thumbnail)

  return (
    <DetailSection id="trailer-title" title="Trailer">
      <div className="relative aspect-video max-w-2xl overflow-hidden rounded-3xl border bg-muted">
        {playing && trailer.embedUrl ? (
          <iframe
            src={trailer.embedUrl}
            title="Trailer"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        ) : trailer.embedUrl ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            <span className="absolute inset-0 bg-background/20 transition-colors group-hover:bg-background/5" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-background/85 shadow-xl backdrop-blur transition-transform group-hover:scale-105">
              <PlayIcon
                className="size-7 translate-x-0.5 fill-current"
                aria-hidden="true"
              />
            </span>
            <span className="sr-only">Play trailer (loads YouTube)</span>
          </button>
        ) : (
          <a
            href={trailer.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium"
          >
            Watch the trailer on Dailymotion
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
      {trailer.embedUrl && !playing ? (
        <p className="text-xs text-muted-foreground">
          Plays from YouTube when you press play.
        </p>
      ) : null}
    </DetailSection>
  )
}
