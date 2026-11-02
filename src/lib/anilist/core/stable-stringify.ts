function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort()
        .map((key) => [key, sortKeys(record[key])]),
    )
  }
  return value
}

/** A copy with object keys sorted and `undefined` values dropped. */
export function canonicalize<T>(value: T): T {
  return sortKeys(value) as T
}

/** JSON with sorted keys, so equal variables always give equal cache keys. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value))
}
