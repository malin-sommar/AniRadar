"use client"

import { useSyncExternalStore } from "react"

const SLOW_TICK_MS = 30_000
const FAST_TICK_MS = 1000

/** Each listener and whether it wants every second. */
const listeners = new Map<() => void, boolean>()
let current = 0
/** Only moves every 30 s, so slow listeners don't redraw every second. */
let currentSlow = 0
let timer: ReturnType<typeof setInterval> | undefined
let timerMs = 0

function tick() {
  current = Date.now()
  if (current - currentSlow >= SLOW_TICK_MS) currentSlow = current
  for (const listener of listeners.keys()) listener()
}

/** One shared timer, ticking every second while any listener needs it. */
function reschedule() {
  const wanted =
    listeners.size === 0
      ? 0
      : [...listeners.values()].some(Boolean)
        ? FAST_TICK_MS
        : SLOW_TICK_MS
  if (wanted === timerMs) return
  if (timer) clearInterval(timer)
  timer = wanted ? setInterval(tick, wanted) : undefined
  timerMs = wanted
}

function initialize() {
  if (current === 0) current = currentSlow = Date.now()
}

const stores = {
  slow: {
    subscribe: (listener: () => void) => subscribe(listener, false),
    // Must return the same value until the next tick, or React re-renders
    // forever.
    getSnapshot: () => {
      initialize()
      return currentSlow
    },
  },
  fast: {
    subscribe: (listener: () => void) => subscribe(listener, true),
    getSnapshot: () => {
      initialize()
      return current
    },
  },
}

function subscribe(listener: () => void, fast: boolean) {
  listeners.set(listener, fast)
  current = currentSlow = Date.now()
  reschedule()
  return () => {
    listeners.delete(listener)
    reschedule()
  }
}

/**
 * The current time in ms, refreshed every 30 seconds, or every second with
 * `"second"` (for live countdowns). `null` during server rendering and
 * hydration, so time-relative text never mismatches the HTML.
 */
export function useNow(precision: "second" | "half-minute" = "half-minute") {
  const store = precision === "second" ? stores.fast : stores.slow
  return useSyncExternalStore<number | null>(
    store.subscribe,
    store.getSnapshot,
    () => null,
  )
}
