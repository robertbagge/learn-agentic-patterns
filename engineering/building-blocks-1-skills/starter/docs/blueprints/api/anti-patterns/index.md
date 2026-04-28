# Anti-Patterns — Index

* [async.md](./async.md) — Blocking the event loop, sync drivers in async
  code, and other concurrency mistakes.
* [error-handling.md](./error-handling.md) — HTTPException in services,
  inconsistent error formats, and leaking internals.
* [schemas.md](./schemas.md) — Raw dicts, missing response models, and
  Pydantic misuse.
* [architecture.md](./architecture.md) — God routers, business logic in
  handlers, and missing service layers.
* [dependencies.md](./dependencies.md) — Heavy computation in Depends(),
  leaked connections, and global mutable state.
* [performance.md](./performance.md) — N+1 queries, no connection pooling,
  and middleware overhead.
