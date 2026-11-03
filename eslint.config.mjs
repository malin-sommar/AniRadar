import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"

// Server-only modules hold secrets or call upstream APIs directly. Shared UI
// and browser modules must reach them through route handlers or server
// components instead. (Feature folders mix server and client components;
// there, `import "server-only"` makes any client import fail the build.)
const serverOnlyImports = {
  paths: [
    {
      name: "@/lib/anilist/server",
      message:
        "Server-only. Use the browser client (@/lib/anilist/browser) or a server component.",
    },
    {
      name: "@/lib/jikan/server",
      message: "Server-only. Fetch the MAL score in a server component.",
    },
    {
      name: "@/lib/sanitize",
      message: "Server-only. Sanitize HTML in a server component.",
    },
    {
      name: "@/lib/kitsu/server",
      message: "Server-only. Use the /api/title-matches route.",
    },
  ],
  patterns: [
    {
      group: ["@/server/*", "@/server"],
      message: "Server-only code can't be imported from UI modules.",
    },
  ],
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: [
      "src/components/**",
      "src/hooks/**",
      "src/lib/query/**",
      "src/lib/anilist/browser.ts",
      "src/lib/anilist/hooks.ts",
      "src/features/browse/fetch-browse-page.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", serverOnlyImports],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "src/lib/anilist/gql/**",
    "src/lib/supabase/database.types.ts",
  ]),
])

export default eslintConfig
