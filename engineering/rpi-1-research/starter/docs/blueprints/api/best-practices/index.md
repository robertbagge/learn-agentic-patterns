# Best Practices — Index

* [project-structure.md](./project-structure.md) — Domain-based organization,
  router composition, thin routes, and the service layer pattern.
* [schemas.md](./schemas.md) — Pydantic models for request/response: separate
  Create, Update, and Response schemas per entity.
* [error-handling.md](./error-handling.md) — Domain exception hierarchy, global
  exception handlers, and consistent error envelopes.
* [dependencies.md](./dependencies.md) — `Depends()` patterns for sessions,
  auth, validation, and `Annotated` type aliases.
* [testing.md](./testing.md) — Async test client, dependency overrides, pytest
  fixtures, and testing the HTTP contract.
* [validation.md](./validation.md) — Pydantic v2 validators, `Annotated`
  constraints, and parameter validation with `Path()` / `Query()`.
* [async-patterns.md](./async-patterns.md) — Async vs sync routes, lifespan
  management, background tasks, and connection pooling.
