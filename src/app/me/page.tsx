import { LogInIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"
import { ThemePicker } from "@/components/theme/theme-toggle"
import {
  AdultContentSetting,
  TitleLanguagePicker,
} from "@/features/settings/content-settings"

export const metadata: Metadata = { title: "Me" }

export default function MePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Me</h1>

      <section
        aria-labelledby="appearance-title"
        className="space-y-5 rounded-3xl border bg-card p-5"
      >
        <div>
          <h2 id="appearance-title" className="font-medium">
            Appearance
          </h2>
          <p className="text-sm text-muted-foreground">
            Saved on this device. After you sign in (coming soon), they follow
            your account.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Theme</h3>
          <ThemePicker />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Title language</h3>
          <p className="text-sm text-muted-foreground">
            Falls back to another language when a title has no translation.
          </p>
          <TitleLanguagePicker />
        </div>
      </section>

      <section
        aria-labelledby="content-title"
        className="space-y-4 rounded-3xl border bg-card p-5"
      >
        <h2 id="content-title" className="font-medium">
          Content
        </h2>
        <AdultContentSetting />
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
