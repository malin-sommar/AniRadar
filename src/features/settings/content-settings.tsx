"use client"

import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import type { TitleLanguage } from "@/domain/media"
import { setPreferences, usePreferences } from "@/hooks/use-preferences"
import { cn } from "@/lib/utils"

const TITLE_OPTIONS: { value: TitleLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "romaji", label: "Romaji" },
  { value: "native", label: "Japanese" },
]

/** Segmented control for the title language, like the theme picker. */
export function TitleLanguagePicker() {
  const { titleLanguage } = usePreferences()

  return (
    <div
      role="radiogroup"
      aria-label="Title language"
      className="inline-flex rounded-full border bg-muted/40 p-1"
    >
      {TITLE_OPTIONS.map((option) => {
        const checked = titleLanguage === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setPreferences({ titleLanguage: option.value })}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
              checked
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * "Show adult content": off by default. Switching it on asks for an
 * 18+ confirmation first; switching it off takes effect straight away.
 */
export function AdultContentSetting() {
  const { showAdult } = usePreferences()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <label htmlFor="show-adult" className="text-sm font-medium">
          Show adult content
        </label>
        <p
          id="show-adult-description"
          className="text-sm text-muted-foreground"
        >
          Includes 18+ anime, genres and tags in browse, search and trending.
        </p>
      </div>
      <Switch
        id="show-adult"
        aria-describedby="show-adult-description"
        checked={showAdult}
        onCheckedChange={(checked) => {
          if (checked) setConfirming(true)
          else setPreferences({ showAdult: false })
        }}
      />
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you 18 or older?</AlertDialogTitle>
            <AlertDialogDescription>
              Adult content includes explicit material. Only switch this on if
              you&apos;re 18 or older. You can switch it off again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setPreferences({ showAdult: true })}
            >
              I&apos;m 18 or older
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
