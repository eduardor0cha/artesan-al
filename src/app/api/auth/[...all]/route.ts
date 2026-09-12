import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/infrastructure/auth/better-auth'

/**
 * The one API route of the MVP. Everything else writes through Server Actions and reads through
 * Server Components (ADR 0009); Better Auth mounts its own endpoints and this hands them over.
 */
export const { GET, POST } = toNextJsHandler(auth)
