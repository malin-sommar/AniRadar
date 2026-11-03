import "server-only"

import { parseServerEnv, type ServerEnv } from "./server-schema"

export type { ServerEnv }

export const serverEnv: ServerEnv = parseServerEnv(process.env)
