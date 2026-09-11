# application

Use cases: one file per operation the system performs, named after the operation
(`search-nearby-sales-points.ts`, `publish-product.ts`). A use case orchestrates domain objects and
talks to the outside world **only through the interfaces in `ports/`** — it never imports Drizzle,
`next/*`, React or the S3 client.

That rule is what makes this layer testable with plain Vitest and no database.

## ports/

The interfaces `infrastructure/` implements. They are written from the use case's point of view:
the repository exposes `findNearby(search)`, not `query(sql)`. Keeping them here — rather than next
to their implementation — is what inverts the dependency and lets the database be swapped without
touching a use case.

## Where things go

```
application/
  artisan/       sign-up, profile editing
  sales-point/   registering a point, searching nearby, duplicate check
  product/       publishing, editing and removing catalogue items
  ports/         interfaces implemented by infrastructure
```

Directories are created as the first use case for each aggregate appears.
