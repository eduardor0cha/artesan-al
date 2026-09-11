import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // PostGIS creates these in the public schema; without the filter every generated migration tries
  // to drop them.
  extensionsFilters: ['postgis'],
  verbose: true,
  strict: true,
})
