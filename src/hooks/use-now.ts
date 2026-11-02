"use client"

import { useSyncExternalStore } from "react"

const TICK_MS = 30_000
const listeners = new Set<() => void>()
let current = 0
let timer: ReturnType<typeof setInterval> | undefined

function tick() {
  current = Date.now()
  for (const listener of listeners) listener()
}

// Must return the same value until the next tick, or React re-renders forever.
function getSnapshot() {
  if (current === 0) current = Date.now()
  return current
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    current = Date.now()
    timer = setInterval(tick, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

/**
 * The current time in ms, refreshed every 30 seconds. `null` during server
 * rendering and hydration, so time-relative text never mismatches the HTML.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
