import { test as base } from "@playwright/test"

// 1×1 transparent PNG.
const PLACEHOLDER_IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
)

/**
 * Covers normally come from AniList's CDN through /img. Serve a placeholder
 * instead, so tests never depend on the network.
 */
export const test = base.extend({
  // Playwright calls the second argument `use`; renamed so the React Hooks
  // lint rule doesn't mistake it for React's `use()`.
  page: async ({ page }, provide) => {
    await page.route("**/img/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/png",
        body: PLACEHOLDER_IMAGE,
      }),
    )
    await provide(page)
  },
})

export { expect } from "@playwright/test"
