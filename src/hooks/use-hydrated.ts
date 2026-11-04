"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * False during server rendering and hydration, true afterwards. For
 * content that exists only in the browser (e.g. data saved on the device),
 * so the first render matches the server's HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
