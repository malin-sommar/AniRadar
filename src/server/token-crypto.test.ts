import { randomBytes } from "node:crypto"

import { describe, expect, it } from "vitest"

import { decryptToken, encryptToken, fromBytea, toBytea } from "./token-crypto"

const key = randomBytes(32).toString("base64")

describe("token encryption", () => {
  it("round-trips a token", () => {
    const sealed = encryptToken("eyJhbGciOi.secret.token", key)
    expect(sealed.ciphertext.toString("utf8")).not.toContain("secret")
    expect(decryptToken(sealed, key)).toBe("eyJhbGciOi.secret.token")
  })

  it("uses a fresh nonce every time", () => {
    const a = encryptToken("same", key)
    const b = encryptToken("same", key)
    expect(a.nonce.equals(b.nonce)).toBe(false)
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false)
  })

  it("rejects tampered data and the wrong key", () => {
    const sealed = encryptToken("token", key)
    const tampered = Buffer.from(sealed.ciphertext)
    tampered[0] = (tampered[0] ?? 0) ^ 0xff
    expect(() =>
      decryptToken({ ...sealed, ciphertext: tampered }, key),
    ).toThrow()
    expect(() =>
      decryptToken(sealed, randomBytes(32).toString("base64")),
    ).toThrow()
  })

  it("rejects a key of the wrong length", () => {
    expect(() =>
      encryptToken("token", randomBytes(16).toString("base64")),
    ).toThrow(/32 bytes/)
  })

  it("converts to and from Postgres bytea", () => {
    const bytes = Buffer.from([0, 1, 254, 255])
    expect(toBytea(bytes)).toBe("\\x0001feff")
    expect(fromBytea("\\x0001feff").equals(bytes)).toBe(true)
  })
})
