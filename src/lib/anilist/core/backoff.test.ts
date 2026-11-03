import { describe, expect, it } from "vitest"

import { backoffDelayMs } from "./backoff"
import { canonicalize, stableStringify } from "./stable-stringify"

describe("backoffDelayMs", () => {
  it("doubles the ceiling per attempt, up to the maximum", () => {
    const ceiling = () => 1
    expect(
      [0, 1, 2, 3, 4, 5].map((attempt) => backoffDelayMs(attempt, ceiling)),
    ).toEqual([500, 1000, 2000, 4000, 8000, 8000])
  })

  it("picks a random delay below the ceiling (full jitter)", () => {
    expect(backoffDelayMs(2, () => 0.25)).toBe(500)
    expect(backoffDelayMs(2, () => 0)).toBe(0)
  })
})

describe("stableStringify", () => {
  it("gives the same string regardless of key order", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 }),
    )
  })

  it("drops undefined values but keeps null", () => {
    expect(stableStringify({ a: undefined, b: null })).toBe('{"b":null}')
  })

  it("keeps array order", () => {
    expect(canonicalize({ list: [3, 1, 2] })).toEqual({ list: [3, 1, 2] })
  })
})
