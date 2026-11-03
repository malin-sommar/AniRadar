"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { DetailSection } from "./section"

/** Long synopses start folded. */
const FOLD_AFTER_CHARACTERS = 600

/** The synopsis, already sanitized on the server. */
export function Synopsis({ html }: { html: string }) {
  const foldable = html.length > FOLD_AFTER_CHARACTERS
  const [open, setOpen] = useState(false)
  const folded = foldable && !open

  return (
    <DetailSection id="synopsis-title" title="Synopsis">
      <div
        id="synopsis-text"
        className={cn(
          "relative max-w-prose space-y-3 text-[15px] leading-relaxed text-foreground/90 [&_a]:underline [&_a]:underline-offset-2 [&_p]:my-0",
          folded && "max-h-48 overflow-hidden mask-b-from-40% mask-b-to-100%",
        )}
        // Sanitized to a small allowlist of tags (lib/sanitize.ts).
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {foldable ? (
        <Button
          variant="link"
          className="h-auto px-0"
          aria-expanded={open}
          aria-controls="synopsis-text"
          onClick={() => setOpen(!open)}
        >
          {open ? "Show less" : "Read more"}
        </Button>
      ) : null}
    </DetailSection>
  )
}
