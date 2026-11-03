import type { NextRequest } from "next/server"
import { z } from "zod"

import { cdnCacheControl } from "@/lib/anilist/cache-policy"
import {
  isAniListError,
  type AniListError,
  type AniListErrorKind,
} from "@/lib/anilist/core/errors"
import {
  cachePolicyForData,
  isOperationName,
  operations,
} from "@/lib/anilist/registry"
import { getAniList } from "@/lib/anilist/server"

/**
 * The browser's only way to AniList. Accepts allowlisted operations with
 * validated variables, answers from the shared cache and lets the CDN cache
 * the response. Errors mirror AniList's shape, plus a `kind` hint.
 */

const MAX_VARIABLES_LENGTH = 2_000

function errorResponse(
  status: number,
  message: string,
  {
    kind,
    retryAfterMs,
  }: { kind?: AniListErrorKind; retryAfterMs?: number } = {},
) {
  const headers = new Headers({ "Cache-Control": "no-store" })
  if (retryAfterMs !== undefined) {
    headers.set(
      "Retry-After",
      String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
    )
  }
  return Response.json(
    { data: null, errors: [{ message, status, kind }] },
    { status, headers },
  )
}

function fromAniListError(error: AniListError) {
  const { kind, retryAfterMs } = error
  switch (kind) {
    case "rate_limited":
      return errorResponse(429, error.message, { kind, retryAfterMs })
    case "api_disabled":
      return errorResponse(503, error.message, { kind, retryAfterMs })
    case "graphql":
      return error.notFound
        ? errorResponse(404, error.message, { kind })
        : errorResponse(502, "AniList rejected the request", { kind })
    default:
      return errorResponse(502, error.message, { kind })
  }
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/anilist/[op]">,
) {
  const { op } = await ctx.params
  if (!isOperationName(op)) return errorResponse(404, "Unknown operation")

  const raw = request.nextUrl.searchParams.get("v") ?? "{}"
  if (raw.length > MAX_VARIABLES_LENGTH)
    return errorResponse(400, "Variables are too long")

  let input: unknown
  try {
    input = JSON.parse(raw)
  } catch {
    return errorResponse(400, "Variables must be JSON")
  }

  const parsed = operations[op].variables.safeParse(input)
  if (!parsed.success) {
    return errorResponse(
      400,
      `Invalid variables: ${z.prettifyError(parsed.error)}`,
    )
  }

  try {
    const data = await getAniList(op, parsed.data)
    return Response.json(
      { data },
      {
        headers: {
          "Cache-Control": cdnCacheControl(cachePolicyForData(op, data)),
        },
      },
    )
  } catch (error) {
    if (isAniListError(error)) return fromAniListError(error)
    console.error("[api/anilist] unexpected error", error)
    return errorResponse(500, "Unexpected error")
  }
}
