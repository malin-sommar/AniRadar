import type { Metadata } from "next"
import { Suspense } from "react"

import { ListSkeleton, ListView } from "@/features/list/list-view"

export const metadata: Metadata = {
  title: "My List",
  robots: { index: false },
}

/** Your AniList list. The list itself loads in the browser (it's yours). */
export default function ListPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Your list</h1>
      {/* The filters come from the URL, which is only known in the browser. */}
      <Suspense fallback={<ListSkeleton />}>
        <ListView />
      </Suspense>
    </div>
  )
}
