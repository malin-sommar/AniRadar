/** Runs once when the server starts: fail fast on bad configuration. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { parseServerEnv } = await import("@/lib/env/server-schema")
    parseServerEnv(process.env)
  }
}
