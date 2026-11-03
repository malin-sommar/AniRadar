import { ExternalLinkIcon } from "lucide-react"
import type { CSSProperties } from "react"

import type { StreamingLink } from "@/domain/detail"
import { imageSrc } from "@/lib/images"

import { DetailSection } from "./section"

/** Branded links to the services AniList lists for this show. */
export function StreamingLinks({ links }: { links: StreamingLink[] }) {
  return (
    <DetailSection id="streaming-title" title="Where to watch">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => {
          const icon = imageSrc(link.icon)
          return (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={
                  link.color
                    ? ({ "--brand": link.color } as CSSProperties)
                    : undefined
                }
                className="inline-flex h-10 items-center gap-2 rounded-full border bg-card pr-3 pl-1.5 text-sm font-medium transition-colors hover:border-(--brand,var(--ring)) hover:bg-accent"
              >
                <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-(--brand,var(--muted))">
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon}
                      alt=""
                      width={20}
                      height={20}
                      loading="lazy"
                      className="size-5 object-contain"
                    />
                  ) : null}
                </span>
                {link.site}
                {link.language ? (
                  <span className="text-xs text-muted-foreground">
                    {link.language}
                  </span>
                ) : null}
                <ExternalLinkIcon
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </a>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        From AniList. Availability varies by region.
      </p>
    </DetailSection>
  )
}
