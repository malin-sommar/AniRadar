"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isThemePreference, type ThemePreference } from "@/lib/theme"
import { cn } from "@/lib/utils"

import { useTheme } from "./use-theme"

export const THEME_OPTIONS: {
  value: ThemePreference
  label: string
  icon: typeof SunIcon
}[] = [
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "system", label: "System", icon: MonitorIcon },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, resolved, setTheme } = useTheme()
  const Icon = resolved === "dark" ? MoonIcon : SunIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="Change theme"
        >
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => {
            if (isThemePreference(value)) setTheme(value)
          }}
        >
          {THEME_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Segmented control version for settings screens. */
export function ThemePicker() {
  const { preference, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-full border bg-muted/40 p-1"
    >
      {THEME_OPTIONS.map((option) => {
        const checked = preference === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
              checked
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground",
            )}
          >
            <option.icon className="size-4" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
