# presentation

Reusable React: components, hooks and the message catalogue. No business rules, no database, no
`infrastructure` imports — a component receives data and callbacks and renders them.

| Directory           | Holds                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `components/ui/`    | shadcn/ui primitives, owned by this repository and free to adapt |
| `components/map/`   | Leaflet map, clustering and the draggable pin                    |
| `components/forms/` | Form fields shared by the artisan's panel                        |
| `hooks/`            | Client-side behaviour, such as reading the device location       |
| `messages/`         | Every user-facing string, in pt-BR                               |

## Rules

- Code is English, interface text is pt-BR and lives in `messages/pt-BR.ts`. No loose strings in
  components.
- Accessibility is verified, not assumed: `pnpm lint` runs `jsx-a11y` and the E2E suite asserts
  against axe. Touch targets start at 44px and there is no smaller button variant.
- Pages under `src/app/` compose these components; the components themselves never fetch data.
