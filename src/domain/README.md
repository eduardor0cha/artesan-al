# domain

Pure TypeScript. **No imports from outside this directory** — no React, no Next.js, no Drizzle, no
zod. If a rule needs a database or an HTTP request to be expressed, it does not belong here.

## Conventions

- **Value objects are classes** with a private constructor and a static `create` returning
  `Result`. They cannot be instantiated in an invalid state, so any code holding one can trust it.
- **Entities are plain readonly types.** They carry identity and data; behaviour lives in value
  objects and use cases while the model is still small.
- Errors are returned, never thrown: a caller must deal with `Result.ok === false`.

## Aggregates

| Directory      | Holds                                                             |
| -------------- | ----------------------------------------------------------------- |
| `artisan/`     | The artisan and their identity (CPF, contact)                     |
| `sales-point/` | Where craft is physically sold, and the rules of proximity search |
| `product/`     | Catalogue items and their prices                                  |
| `shared/`      | `Result`, ids and other primitives used by every aggregate        |
