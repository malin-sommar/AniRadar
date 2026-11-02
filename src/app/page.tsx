import { Suspense } from "react"

import { TrendingSection } from "@/features/home/trending-section"
import { TrendingSkeleton } from "@/features/home/trending-showcase"

export default function HomePage() {
  return (
    <>
      <h1 className="sr-only">AniRadar</h1>
      <Suspense fallback={<TrendingSkeleton />}>
        <TrendingSection />
      </Suspense>
    </>
  )
}
