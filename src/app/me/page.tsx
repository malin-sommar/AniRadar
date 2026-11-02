import { LogInIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"
import { ThemePicker } from "@/components/theme/theme-toggle"

export const metadata: Metadata = { title: "Me" }

export default function MePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Me</h1>

      <section className="space-y-3 rounded-3xl border bg-card p-5">
        <div>
          <h2 className="font-medium">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Dark is the default. Your choice is saved on this device.
          </p>
        </div>
        <ThemePicker />
      </section>

      <EmptyState
        icon={LogInIcon}
        tag="Coming in Phase 3"
        title="Sign in & connect AniList"
        description="Sign in with email, Google or Discord, then connect your AniList account to track your shows."
      />
    </div>
  )
}
