import { z } from "zod"

const unset = (value: unknown) => (value === "" ? undefined : value)

const serverEnvSchema = z.object({
  /** Points at a mock server in end-to-end tests. */
  ANILIST_API_URL: z.preprocess(
    unset,
    z.url().default("https://graphql.anilist.co"),
  ),
  /** Starting request budget. AniList is degraded to 30/min; keep headroom. */
  ANILIST_REQUESTS_PER_MINUTE: z.preprocess(
    unset,
    z.coerce.number().int().min(1).max(90).default(25),
  ),
  /** Ceiling when AniList's headers report a higher limit (90/min normally). */
  ANILIST_MAX_REQUESTS_PER_MINUTE: z.preprocess(
    unset,
    z.coerce.number().int().min(1).max(90).default(76),
  ),
  ANILIST_TIMEOUT_MS: z.preprocess(
    unset,
    z.coerce.number().int().min(1000).max(30000).default(10000),
  ),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/** Throws one readable error listing every invalid variable. */
export function parseServerEnv(
  env: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(env)
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    )
  }
  return result.data
}
