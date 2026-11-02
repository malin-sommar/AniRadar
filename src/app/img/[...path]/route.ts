/**
 * Same-origin image proxy for AniList's CDN. Only image files under AniList's
 * media folders are allowed, so this can't be used to fetch anything else.
 * The CDN caches every image for a year (AniList file names change when the
 * image does).
 */

const UPSTREAMS: Record<string, { origin: string; allowedPath: RegExp }> = {
  anilist: {
    origin: "https://s4.anilist.co/",
    allowedPath: /^file\/anilistcdn\/[\w/.-]+\.(?:jpe?g|png|gif|webp|avif)$/i,
  },
}

const TIMEOUT_MS = 10_000
const MAX_BYTES = 10 * 1024 * 1024

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  })
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/img/[...path]">,
) {
  const { path } = await ctx.params
  const [source, ...rest] = path
  const upstream = source ? UPSTREAMS[source] : undefined
  const filePath = rest.join("/")
  if (
    !upstream ||
    filePath.includes("..") ||
    !upstream.allowedPath.test(filePath)
  ) {
    return notFound()
  }

  let response: Response
  try {
    response = await fetch(upstream.origin + filePath, {
      headers: { Accept: "image/avif,image/webp,image/*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return new Response("Image unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    })
  }

  if (response.status === 404) return notFound()
  const contentType = response.headers.get("content-type") ?? ""
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (
    !response.ok ||
    !contentType.startsWith("image/") ||
    contentLength > MAX_BYTES
  ) {
    return new Response("Image unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    })
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, s-maxage=31536000, immutable",
    },
  })
}
