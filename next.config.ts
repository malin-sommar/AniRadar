import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

import { withSerwist } from "@serwist/turbopack"
import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"
const imageProxyOff = process.env.NEXT_PUBLIC_IMAGE_PROXY === "off"

// Changes whenever the generated GraphQL documents change. Query data saved
// on devices in an older shape is then discarded instead of rendered.
const queryCacheBuster = createHash("sha256")
  .update(readFileSync("src/lib/anilist/gql/graphql.ts"))
  .digest("hex")
  .slice(0, 12)

// No nonces: they force every page to render per request, which conflicts
// with static, offline-ready pages. Scripts therefore allow 'unsafe-inline'
// (Next.js's inline bootstrap and the theme script); everything else is
// locked to this origin. Phase 8 evaluates hash-based CSP (experimental SRI).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${imageProxyOff ? " https://s4.anilist.co" : ""}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
]

const nextConfig: NextConfig = {
  // End-to-end tests build into their own folder (with mock data baked in),
  // so they never overwrite a normal build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_QUERY_CACHE_BUSTER: queryCacheBuster,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default withSerwist(nextConfig)
