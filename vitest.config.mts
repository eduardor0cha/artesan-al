import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Two projects, matching the test strategy:
 *
 * - `unit` covers domain, application and the pure helpers in presentation. They are pure, so these
 *   run in milliseconds with no Docker and no mocks worth the name.
 * - `integration` covers repositories against a real PostGIS container. ST_DWithin and the GiST
 *   index cannot be mocked without testing nothing at all, so these are worth their slowness.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the "@/*" alias straight from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/{domain,application,infrastructure,presentation}/**/*.test.ts'],
          exclude: ['**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.integration.test.ts'],
          // Starting a Postgres container takes a while on a cold image pull.
          testTimeout: 120_000,
          hookTimeout: 180_000,
          // A shared container per file keeps the suite honest about isolation without paying
          // container startup per test.
          fileParallelism: false,
        },
      },
    ],
  },
})
