import type { ListEntry } from "@/domain/my-list"

/** What /api/me/list answers (also when there's no list to show). */
export type MyListResponse =
  | {
      status: "ok"
      entries: ListEntry[]
      /** Your streaming services (settings), for "On my services". */
      myServices: string[]
      fetchedAt: number
    }
  | { status: "signed-out" | "not-connected" | "expired" | "unavailable" }
  | { status: "busy"; retryAfterSeconds?: number }
