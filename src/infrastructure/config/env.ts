import { z } from 'zod'

const serverSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET precisa de ao menos 32 caracteres'),
  BETTER_AUTH_URL: z.url(),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_PUBLIC_URL: z.url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export type ServerEnv = z.infer<typeof serverSchema>

let cached: ServerEnv | null = null

/**
 * Reads and validates server configuration, failing at boot instead of at the first request that
 * happens to need a variable. Never call this from a Client Component: these values are secrets.
 */
export function serverEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverSchema.safeParse(process.env)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Variáveis de ambiente inválidas:\n${details}\n\nVeja .env.example.`)
  }

  cached = parsed.data
  return cached
}

/** Safe to read in the browser: only ever holds values prefixed with NEXT_PUBLIC_. */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const
