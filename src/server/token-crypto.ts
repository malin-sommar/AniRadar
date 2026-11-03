import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/*
 * AniList tokens are stored encrypted (AES-256-GCM). The key lives only in
 * the server's environment (ANILIST_TOKEN_KEY), never in the database.
 */

const NONCE_BYTES = 12
const TAG_BYTES = 16

export interface EncryptedToken {
  /** Ciphertext followed by the 16-byte authentication tag. */
  ciphertext: Buffer
  nonce: Buffer
}

function keyFrom(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64")
  if (key.length !== 32) throw new Error("The token key must be 32 bytes")
  return key
}

export function encryptToken(token: string, base64Key: string): EncryptedToken {
  const nonce = randomBytes(NONCE_BYTES)
  const cipher = createCipheriv("aes-256-gcm", keyFrom(base64Key), nonce)
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  return { ciphertext, nonce }
}

/** Throws if the data was tampered with or the key is wrong. */
export function decryptToken(
  { ciphertext, nonce }: EncryptedToken,
  base64Key: string,
): string {
  const decipher = createDecipheriv("aes-256-gcm", keyFrom(base64Key), nonce)
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - TAG_BYTES))
  return Buffer.concat([
    decipher.update(ciphertext.subarray(0, ciphertext.length - TAG_BYTES)),
    decipher.final(),
  ]).toString("utf8")
}

/** Postgres bytea literal for Supabase RPC arguments ("\x…"). */
export function toBytea(buffer: Buffer): string {
  return `\\x${buffer.toString("hex")}`
}

/** Reads a bytea value as Supabase returns it ("\x…" hex). */
export function fromBytea(value: string): Buffer {
  return Buffer.from(value.startsWith("\\x") ? value.slice(2) : value, "hex")
}
