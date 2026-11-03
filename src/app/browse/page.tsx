import { CompassIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"

export const metadata: Metadata = { title: "Browse" }

export default function BrowsePage() {
  return (
    <EmptyState
      icon={CompassIcon}
      tag="Coming in Phase 1"
      title="Browse & search"
      description="Search every anime on AniList and filter by genre, tags, season, format and status."
      className="mt-10"
    />
  )
}
