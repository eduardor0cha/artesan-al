# infrastructure

The replaceable details: database, object storage, authentication and configuration. Everything
here implements an interface declared in `application/ports/` — nothing in this layer invents its
own contract.

| Directory  | Holds                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| `db/`      | Drizzle schema, versioned `.sql` migrations, repositories and the seed |
| `storage/` | S3-compatible image storage (MinIO locally, any bucket in production)  |
| `auth/`    | Better Auth setup: CPF as identifier, OTP recovery, admin role         |
| `config/`  | Environment validation, which fails at boot rather than at first use   |

## Rules

- A repository translates between rows and domain types. Validation belongs to the domain: if a
  row cannot become a valid domain object, that is a bug in whatever wrote it, and the repository
  says so loudly.
- Spatial queries are raw SQL on purpose — `ST_DWithin` and `<->` have no query-builder equivalent.
- Swapping MinIO for S3, R2 or Supabase Storage is a change of environment variables, not of code.
