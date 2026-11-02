export type AniListErrorKind =
  /** 429 from AniList or our proxy, or our own queue would wait too long. */
  | "rate_limited"
  /** 403: AniList has switched its API off, or blocked this server. */
  | "api_disabled"
  /** HTTP 5xx. */
  | "server_error"
  /** The request never got a response (offline, DNS, timeout). */
  | "network"
  /** AniList rejected the query or its variables. 404 means "not found". */
  | "graphql"
  /** The body wasn't the JSON we expected. */
  | "invalid_response"
  /** The caller cancelled the request. */
  | "aborted"

export const ERROR_KINDS: readonly AniListErrorKind[] = [
  "rate_limited",
  "api_disabled",
  "server_error",
  "network",
  "graphql",
  "invalid_response",
  "aborted",
]

export interface GraphQLErrorItem {
  message: string
  status?: number
  /** Set by our proxy so the browser client can classify its errors. */
  kind?: AniListErrorKind
  locations?: { line: number; column: number }[]
  validation?: Record<string, string[]>
}

interface AniListErrorOptions {
  status?: number
  retryAfterMs?: number
  errors?: GraphQLErrorItem[]
  /** "queue" means our own limiter gave up waiting; don't retry it. */
  source?: "upstream" | "queue"
  cause?: unknown
}

export class AniListError extends Error {
  readonly kind: AniListErrorKind
  readonly status: number | undefined
  readonly retryAfterMs: number | undefined
  readonly errors: GraphQLErrorItem[] | undefined
  readonly source: "upstream" | "queue"

  constructor(
    kind: AniListErrorKind,
    message: string,
    options: AniListErrorOptions = {},
  ) {
    super(message, { cause: options.cause })
    this.name = "AniListError"
    this.kind = kind
    this.status = options.status
    this.retryAfterMs = options.retryAfterMs
    this.errors = options.errors
    this.source = options.source ?? "upstream"
  }

  /** Worth retrying automatically, after a delay. */
  get transient(): boolean {
    return (
      this.kind === "rate_limited" ||
      this.kind === "server_error" ||
      this.kind === "network" ||
      this.kind === "invalid_response"
    )
  }

  get notFound(): boolean {
    return this.kind === "graphql" && this.status === 404
  }
}

export function isAniListError(value: unknown): value is AniListError {
  return value instanceof AniListError
}

export function isErrorKind(value: unknown): value is AniListErrorKind {
  return ERROR_KINDS.includes(value as AniListErrorKind)
}

/** Normalizes anything a transport can throw into an AniListError. */
export function toAniListError(
  caught: unknown,
  signal?: AbortSignal,
): AniListError {
  if (caught instanceof AniListError) return caught
  const name = caught instanceof Error ? caught.name : undefined
  if (signal?.aborted || name === "AbortError") {
    return new AniListError("aborted", "Request cancelled", { cause: caught })
  }
  if (name === "TimeoutError") {
    return new AniListError("network", "AniList didn't respond in time", {
      cause: caught,
    })
  }
  return new AniListError("network", "Couldn't reach AniList", {
    cause: caught,
  })
}
