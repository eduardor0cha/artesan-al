# presentation

Reusable React: components, hooks and the message catalogue. No business rules, no database, no
`infrastructure` imports — a component receives data and callbacks and renders them.

| Directory            | Holds                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `components/ui/`     | Primitives in the shadcn/ui style, owned here and free to adapt      |
| `components/search/` | The proximity search: result card, radius filter and the Leaflet map |
| `components/forms/`  | Form fields shared by the artisan's panel                            |
| `hooks/`             | Client-side behaviour, such as reading the device location           |
| `lib/`               | Small pure helpers: class merging, distance formatting, search URLs  |
| `messages/`          | Every user-facing string, in pt-BR                                   |

## Rules

- Code is English, interface text is pt-BR and lives in `messages/pt-BR.ts`. No loose strings in
  components.
- Accessibility is verified, not assumed: `pnpm lint` runs `jsx-a11y` and the E2E suite asserts
  against axe. Touch targets start at 44px and there is no smaller button variant.
- Pages under `src/app/` compose these components; the components themselves never fetch data.
- Anything Leaflet touches is a Client Component loaded with `ssr: false`, and never the only way
  to read the content: the server-rendered list beside the map carries the same information.
