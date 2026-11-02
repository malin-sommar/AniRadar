import { spawnSync } from "node:child_process"

import { createSerwistRoute } from "@serwist/turbopack"
import { cacheLife } from "next/cache"

// Changes with every commit so the offline page is re-cached after deploys.
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout?.trim() ||
  crypto.randomUUID()

const serwist = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  useNativeEsbuild: true,
  // A classic (non-module) worker works in every browser that supports PWAs.
  esbuildOptions: { format: "iife" },
})

// Serwist also suggests `dynamic` and `revalidate` exports, which Cache
// Components doesn't allow. Caching the build output below has the same
// effect: the worker is bundled once, at build time.
export const { dynamicParams, generateStaticParams } = serwist

async function buildWorkerFile(path: string) {
  "use cache"
  cacheLife("max")
  const response = await serwist.GET(new Request("http://localhost/"), {
    params: Promise.resolve({ path }),
  })
  return {
    body: await response.text(),
    headers: Object.fromEntries(response.headers),
  }
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/serwist/[path]">,
) {
  const { path } = await ctx.params
  const file = await buildWorkerFile(path)
  return new Response(file.body, {
    headers: {
      ...file.headers,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
