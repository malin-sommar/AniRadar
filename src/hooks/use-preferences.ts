"use client"

import { useSyncExternalStore } from "react"

import { displayTitle, type MediaTitleFields } from "@/domain/media"
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  parsePreferences,
  type Preferences,
} from "@/lib/preferences"

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cached: Preferences = DEFAULT_PREFERENCES
/** Used when localStorage is unavailable (private mode), for this page view. */
let memoryRaw: string | null = null

function readRaw(): string | null {
  try {
    return localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? memoryRaw
  } catch {
    return memoryRaw
  }
}

// Returns the same object until the stored value changes, as
// useSyncExternalStore requires.
function getSnapshot(): Preferences {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cached = parsePreferences(raw)
  }
  return cached
}

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keeps tabs in sync when a setting changes in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === PREFERENCES_STORAGE_KEY) notify()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** While signed in: saves changes to the profile too (see ProfileSync). */
let saveToProfile: ((changes: Partial<Preferences>) => void) | null = null

export function setProfileSync(
  save: ((changes: Partial<Preferences>) => void) | null,
) {
  saveToProfile = save
}

function store(changes: Partial<Preferences>) {
  const raw = JSON.stringify({ ...getSnapshot(), ...changes })
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, raw)
  } catch {
    memoryRaw = raw
  }
  notify()
}

export function setPreferences(changes: Partial<Preferences>) {
  store(changes)
  saveToProfile?.(changes)
}

/** Applies settings loaded from the profile, without saving them back. */
export function applyProfilePreferences(preferences: Preferences) {
  store(preferences)
}

/**
 * The device's display and content settings. The server render and
 * hydration use the defaults, then saved settings apply.
 */
export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PREFERENCES)
}

/** A media title in the chosen title language, with fallbacks. */
export function useDisplayTitle(title: MediaTitleFields | null | undefined) {
  return displayTitle(title, usePreferences().titleLanguage)
}
