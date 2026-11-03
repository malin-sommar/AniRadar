import { z } from "zod"

/** Treats empty strings (e.g. `FOO=` in .env) as "not set". */
const unset = (value: unknown) => (value === "" ? undefined : value)

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    unset,
    z.url().default("http://localhost:3000"),
  ),
  /** "off" loads images straight from AniList's CDN instead of /img/*. */
  NEXT_PUBLIC_IMAGE_PROXY: z.preprocess(
    unset,
    z.enum(["on", "off"]).default("on"),
  ),
  /** Shows the AniList debug panel outside development. */
  NEXT_PUBLIC_DEBUG_PANEL: z.preprocess(unset, z.stringbool().default(false)),
})

const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL

// Each NEXT_PUBLIC_ variable is referenced literally so Next.js can inline it
// into the client bundle.
export const clientEnv = schema.parse({
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelUrl ? `https://${vercelUrl}` : undefined),
  NEXT_PUBLIC_IMAGE_PROXY: process.env.NEXT_PUBLIC_IMAGE_PROXY,
  NEXT_PUBLIC_DEBUG_PANEL: process.env.NEXT_PUBLIC_DEBUG_PANEL,
})
