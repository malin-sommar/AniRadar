import { defineConfig, devices } from "@playwright/test"

const PORT = 3200
const MOCK_ANILIST_PORT = 4010

/**
 * End-to-end tests against a production build, with AniList replaced by a
 * fixture server so tests are deterministic and never hit the real API.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "node tests/e2e/mock-anilist.mjs",
      url: `http://127.0.0.1:${MOCK_ANILIST_PORT}`,
      env: { MOCK_ANILIST_PORT: String(MOCK_ANILIST_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm build && pnpm start --port ${PORT}`,
      url: `http://127.0.0.1:${PORT}`,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        ANILIST_API_URL: `http://127.0.0.1:${MOCK_ANILIST_PORT}/graphql`,
        KITSU_API_URL: `http://127.0.0.1:${MOCK_ANILIST_PORT}/kitsu`,
        NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${PORT}`,
      },
    },
  ],
})
