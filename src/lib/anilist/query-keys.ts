import { canonicalize } from "./core/stable-stringify"
import type { OperationName } from "./registry"

/** Shared by server prefetching and client queries, so hydration lines up. */
export function aniListQueryKey(name: OperationName, variables: object) {
  return ["anilist", name, canonicalize(variables)] as const
}
