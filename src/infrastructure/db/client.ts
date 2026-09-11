import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { serverEnv } from '../config/env'
import * as schema from './schema'

/**
 * A single connection pool per process. Next.js reloads modules on every edit in development, so
 * the client is cached on globalThis to avoid exhausting Postgres connections while developing.
 */
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> }

function createClient() {
  return postgres(serverEnv().DATABASE_URL, { max: 10 })
}

const sql = globalForDb.sql ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql
}

export const db = drizzle(sql, { schema })

export type Database = typeof db

export { sql }
