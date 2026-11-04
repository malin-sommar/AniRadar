import "server-only"

import type { User } from "@supabase/supabase-js"

import { isAniListError } from "@/lib/anilist/core/errors"
import { serverEnv } from "@/lib/env/server"

import { createAdminClient, createUserClient } from "./supabase"
import { decryptToken, fromBytea } from "./token-crypto"

/*
 * Your AniList access, for requests made on your behalf: your AniList user
 * ID and the decrypted token. The token never leaves the server.
 */

export type AniListAccess =
  | { ok: true; anilistUserId: number; token: string }
  | { ok: false; reason: "not-connected" | "expired" | "unavailable" }

export async function getAniListAccess(user: User): Promise<AniListAccess> {
  const key = serverEnv.ANILIST_TOKEN_KEY
  if (!key) return { ok: false, reason: "unavailable" }

  // Read with your own session, so RLS keeps it to your row.
  const supabase = await createUserClient()
  const { data: connection } = await supabase
    .from("anilist_connections")
    .select("anilist_user_id, expires_at")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!connection) return { ok: false, reason: "not-connected" }
  if (Date.parse(connection.expires_at) <= Date.now()) {
    return { ok: false, reason: "expired" }
  }

  const { data: rows, error } = await createAdminClient().rpc(
    "get_anilist_token",
    { p_user_id: user.id },
  )
  const row = rows?.[0]
  if (error || !row) return { ok: false, reason: "not-connected" }
  try {
    const token = decryptToken(
      { ciphertext: fromBytea(row.ciphertext), nonce: fromBytea(row.nonce) },
      key,
    )
    return { ok: true, anilistUserId: connection.anilist_user_id, token }
  } catch {
    // A different key than the one it was saved with: reconnect fixes it.
    return { ok: false, reason: "expired" }
  }
}

/** AniList rejected the token (revoked on AniList, or expired early). */
export function isUnauthorized(error: unknown): boolean {
  return (
    isAniListError(error) &&
    (error.status === 401 ||
      /invalid token|unauthori[sz]ed/i.test(error.message))
  )
}

/**
 * Marks the connection as expired, so Me and the list ask you to reconnect.
 * The token is kept until you reconnect or disconnect.
 */
export async function markConnectionExpired(userId: string) {
  await createAdminClient()
    .from("anilist_connections")
    .update({ expires_at: new Date().toISOString() })
    .eq("user_id", userId)
}
