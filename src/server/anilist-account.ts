import "server-only"

import { randomBytes, timingSafeEqual } from "node:crypto"

import { z } from "zod"

import { serverEnv } from "@/lib/env/server"

import { createAdminClient } from "./supabase"
import { encryptToken, toBytea } from "./token-crypto"

/*
 * "Connect AniList" (PLAN.md §9): the authorization code grant. The token
 * is exchanged and stored on the server only, encrypted.
 */

export const STATE_COOKIE = "aniradar-anilist-state"
export const STATE_MAX_AGE_SECONDS = 10 * 60

const AUTHORIZE_URL = "https://anilist.co/api/v2/oauth/authorize"
const TOKEN_URL = "https://anilist.co/api/v2/oauth/token"
const TIMEOUT_MS = 10_000

export function anilistOAuthConfig() {
  const clientId = serverEnv.ANILIST_CLIENT_ID
  const clientSecret = serverEnv.ANILIST_CLIENT_SECRET
  const redirectUri = serverEnv.ANILIST_REDIRECT_URI
  const tokenKey = serverEnv.ANILIST_TOKEN_KEY
  if (!clientId || !clientSecret || !redirectUri || !tokenKey) return null
  return { clientId, clientSecret, redirectUri, tokenKey }
}

/** A fresh state value and the cookie that ties it to the signed-in user. */
export function createState(userId: string) {
  const state = randomBytes(24).toString("base64url")
  return { state, cookie: `${state}.${userId}` }
}

/** Checks the returned state against the cookie and the current user. */
export function checkState(
  cookie: string | undefined,
  returnedState: string | null,
  userId: string,
): boolean {
  if (!cookie || !returnedState) return false
  const dot = cookie.indexOf(".")
  const expected = Buffer.from(cookie.slice(0, dot))
  const actual = Buffer.from(returnedState)
  return (
    dot > 0 &&
    cookie.slice(dot + 1) === userId &&
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  )
}

export function authorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  })
  return `${AUTHORIZE_URL}?${params}`
}

const tokenSchema = z.object({
  access_token: z.string().min(20),
  expires_in: z.number().int().positive(),
})

const viewerSchema = z.object({
  data: z.object({
    Viewer: z.object({
      id: z.int().positive(),
      name: z.string().min(1),
      mediaListOptions: z
        .object({ scoreFormat: z.string().nullish() })
        .nullish(),
    }),
  }),
})

export type ConnectResult =
  | { ok: true; name: string }
  | { ok: false; reason: "exchange" | "viewer" | "taken" | "save" }

/**
 * Swaps the code for a token, asks AniList who it belongs to, and stores
 * the connection (name, score format, expiry) and the encrypted token.
 */
export async function connectAniList(
  userId: string,
  code: string,
): Promise<ConnectResult> {
  const config = anilistOAuthConfig()
  if (!config) return { ok: false, reason: "exchange" }

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null)
  const token = tokenSchema.safeParse(
    await tokenResponse?.json().catch(() => null),
  )
  if (!tokenResponse?.ok || !token.success)
    return { ok: false, reason: "exchange" }

  const viewerResponse = await fetch(serverEnv.ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token.data.access_token}`,
    },
    body: JSON.stringify({
      query:
        "query Viewer { Viewer { id name mediaListOptions { scoreFormat } } }",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null)
  const viewer = viewerSchema.safeParse(
    await viewerResponse?.json().catch(() => null),
  )
  if (!viewer.success) return { ok: false, reason: "viewer" }

  const { id, name, mediaListOptions } = viewer.data.data.Viewer
  const expiresAt = new Date(
    Date.now() + token.data.expires_in * 1000,
  ).toISOString()
  const sealed = encryptToken(token.data.access_token, config.tokenKey)
  const admin = createAdminClient()

  const connection = await admin.from("anilist_connections").upsert({
    user_id: userId,
    anilist_user_id: id,
    anilist_name: name,
    score_format: mediaListOptions?.scoreFormat ?? "POINT_10",
    expires_at: expiresAt,
    connected_at: new Date().toISOString(),
  })
  if (connection.error) {
    // One AniList account belongs to one AniRadar account.
    if (connection.error.code === "23505") return { ok: false, reason: "taken" }
    console.warn(
      "[anilist] Couldn't save the connection:",
      connection.error.message,
    )
    return { ok: false, reason: "save" }
  }

  const saved = await admin.rpc("save_anilist_token", {
    p_user_id: userId,
    p_ciphertext: toBytea(sealed.ciphertext),
    p_nonce: toBytea(sealed.nonce),
    p_expires_at: expiresAt,
  })
  if (saved.error) {
    console.warn("[anilist] Couldn't save the token:", saved.error.message)
    await admin.from("anilist_connections").delete().eq("user_id", userId)
    return { ok: false, reason: "save" }
  }
  return { ok: true, name }
}

/** Removes the token and the connection. */
export async function disconnectAniList(userId: string) {
  const admin = createAdminClient()
  await admin.rpc("delete_anilist_token", { p_user_id: userId })
  await admin.from("anilist_connections").delete().eq("user_id", userId)
}
