import type { Metadata } from "next"
import { Suspense } from "react"

import { BrowseSection, BrowseSkeleton } from "@/features/browse/browse-section"

export const metadata: Metadata = {
  title: "Browse",
  description:
    "Search every anime on AniList and filter by genre, tags, season, format and status.",
}

export default function BrowsePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Browse</h1>
        <p className="text-sm text-muted-foreground">
          Search every anime on AniList, filter and sort.
        </p>
      </div>
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseSection />
      </Suspense>
    </div>
  )
}
