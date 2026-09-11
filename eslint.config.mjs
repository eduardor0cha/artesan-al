import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Accessibility is a first-class requirement of this project, not a nice-to-have: part of the
  // audience has little digital literacy and uses entry-level devices. eslint-config-next already
  // registers the jsx-a11y plugin with a partial rule set, so only the rules are spread in here —
  // re-registering the plugin is a hard error in flat config.
  {
    files: ['src/**/*.tsx'],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain/**/*' },
        { type: 'application', pattern: 'src/application/**/*' },
        { type: 'infrastructure', pattern: 'src/infrastructure/**/*' },
        { type: 'presentation', pattern: 'src/presentation/**/*' },
        { type: 'app', pattern: 'src/app/**/*' },
      ],
    },
    rules: {
      /**
       * The dependency rule of the architecture, enforced instead of merely documented. `app` is
       * the composition root — it is the only layer allowed to reach into infrastructure, to wire
       * a concrete repository into a use case.
       */
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              allow: { to: { element: { type: 'domain' } } },
            },
            {
              from: { element: { type: 'application' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'application'] } } } },
            },
            {
              from: { element: { type: 'infrastructure' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['domain', 'application', 'infrastructure'] } },
                },
              },
            },
            {
              from: { element: { type: 'presentation' } },
              allow: {
                to: { element: { types: { anyOf: ['domain', 'application', 'presentation'] } } },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ['domain', 'application', 'infrastructure', 'presentation', 'app'],
                    },
                  },
                },
              },
            },

            // Third-party packages are fine everywhere by default...
            { allow: { to: { module: { origin: 'external' } } } },
            // ...except in the domain, which must stay pure TypeScript.
            {
              from: { element: { type: 'domain' } },
              disallow: { to: { module: { origin: 'external' } } },
              message: 'A camada domain não pode depender de bibliotecas externas.',
            },
            // The application layer reaches the outside world only through its ports.
            {
              from: { element: { type: 'application' } },
              disallow: {
                to: {
                  module: {
                    origin: 'external',
                    source: [
                      'next',
                      'next/*',
                      'react',
                      'react-dom',
                      'drizzle-orm',
                      'drizzle-orm/*',
                    ],
                  },
                },
              },
              message: 'A camada application fala com o mundo externo apenas por ports.',
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'src/infrastructure/db/migrations/**',
    // Build output: the bundled service worker and anything else generated into public/.
    'public/sw.js',
    'public/**/*.js',
  ]),
])

export default eslintConfig
