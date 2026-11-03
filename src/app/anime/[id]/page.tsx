import { TvIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Anime" }

// Placeholder so cards have somewhere to link. Phase 2 builds the real
// detail page (and adds the title slug to the URL).
export default function AnimePage() {
  return (
    <EmptyState
      icon={TvIcon}
      tag="Coming in Phase 2"
      title="Anime details"
      description="Banner, synopsis, characters and voice actors, where to stream, all seasons in order and the next-episode countdown."
      className="mt-10"
    >
      <Button asChild variant="secondary">
        <Link href="/">Back to Home</Link>
      </Button>
    </EmptyState>
  )
}
