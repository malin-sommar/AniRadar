"use client"

import { useCallback, useSyncExternalStore } from "react"

import {
  DEFAULT_THEME,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  isThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme"

const listeners = new Set<() => void>()
const DARK_QUERY = "(prefers-color-scheme: dark)"

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[resolved])
}

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (readPreference() === "system") {
      applyTheme(resolveTheme("system", media.matches))
      notify()
    }
  }
  // Keeps tabs in sync when the theme changes in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(resolveTheme(readPreference(), media.matches))
    notify()
  }
  media.addEventListener("change", onSystemChange)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener("change", onSystemChange)
    window.removeEventListener("storage", onStorage)
  }
}

export function useTheme() {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => DEFAULT_THEME,
  )
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolveTheme(readPreference(), systemPrefersDark()),
    () => resolveTheme(DEFAULT_THEME, true),
  )

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable (private mode); the change still applies
      // for this page view.
    }
    applyTheme(resolveTheme(next, systemPrefersDark()))
    notify()
  }, [])

  return { preference, resolved, setTheme }
}
