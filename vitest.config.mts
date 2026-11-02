import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const src = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${src}/` },
      // `server-only` throws outside React Server Components; tests run
      // server modules directly, so swap in an empty module.
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL("./tests/stubs/empty.ts", import.meta.url),
        ),
      },
    ],
  },
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
      {
        // A few real AniList requests to catch schema changes. Run by hand
        // (`pnpm test:live`), never in CI: it spends real rate-limit budget.
        extends: true,
        test: {
          name: "live",
          include: ["tests/live/**/*.live.test.ts"],
          environment: "node",
          testTimeout: 30_000,
        },
      },
    ],
  },
})
