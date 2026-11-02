import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { del, get, set } from "idb-keyval"

/**
 * IndexedDB can be missing or blocked (private mode, storage cleared), so
 * every call fails soft: the app simply starts without saved data.
 */
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return (await get<string>(key)) ?? null
    } catch {
      return null
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await set(key, value)
    } catch {
      // Quota exceeded or storage blocked: skip saving this time.
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await del(key)
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  },
}

export function createQueryPersister() {
  return createAsyncStoragePersister({
    storage,
    key: "aniradar-query-cache",
    throttleTime: 2000,
  })
}
