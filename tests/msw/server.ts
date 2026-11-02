import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"

/**
 * Network mocking for tests that exercise real fetch/Headers plumbing.
 * Add handlers per test with `server.use(...)`. Unhandled requests fail
 * the test, so nothing ever reaches the real AniList.
 */
export const server = setupServer()

export function setupMockServer() {
  beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}
