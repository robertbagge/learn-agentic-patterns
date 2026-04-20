# Clean Code – API (Python / FastAPI)

## What this is

A practical, opinionated guide to clean code: SOLID-style principles adapted
for Python services built with FastAPI.

## Who it's for

Engineers and AI agents building or refactoring FastAPI services.

## Scope & portability

Python 3.12+, FastAPI, Pydantic. Examples use `async/await`, type hints,
`Protocol` for contracts, and constructor-based dependency injection.

## How to use this guide

### For AI agent research

Unless otherwise instructed, read all documents to get a full picture of best
practices, anti-patterns & clean code before distilling for your task.

### For implementation guidance

Lead with the [Best Practices index](./best-practices/index.md), then dip
into the clean-code principles as needed. Common starting points:
[SRP](./clean-code/single-responsibility.md) and
[DIP](./clean-code/dependency-inversion.md).

Check the [Anti-Patterns index](./anti-patterns/index.md) when reviewing
code or diagnosing issues.

## Best practices

* [Project Structure](./best-practices/project-structure.md)
  – Domain-based organization, thin routes, service layer.
* [Schemas](./best-practices/schemas.md)
  – Separate Create/Update/Response Pydantic models per entity.
* [Error Handling](./best-practices/error-handling.md)
  – Domain exceptions, global handlers, consistent error envelopes.
* [Dependencies](./best-practices/dependencies.md)
  – `Depends()` patterns, `Annotated` aliases, yield cleanup.
* [Testing](./best-practices/testing.md)
  – Async test client, dependency overrides, pytest fixtures.
* [Validation](./best-practices/validation.md)
  – Pydantic v2 validators, `Annotated` constraints, `Path()`/`Query()`.
* [Async Patterns](./best-practices/async-patterns.md)
  – Async vs sync, lifespan, background tasks, connection pooling.

## Anti-patterns

* [Async](./anti-patterns/async.md)
  – Blocking the event loop, sync in async, threadpool starvation.
* [Error Handling](./anti-patterns/error-handling.md)
  – HTTPException in services, inconsistent formats, leaking internals.
* [Schemas](./anti-patterns/schemas.md)
  – Raw dicts, missing response models, Pydantic misuse.
* [Architecture](./anti-patterns/architecture.md)
  – God routers, logic in handlers, missing service layers.
* [Dependencies](./anti-patterns/dependencies.md)
  – Heavy computation in Depends(), leaked connections, global state.
* [Performance](./anti-patterns/performance.md)
  – N+1 queries, no pooling, middleware overhead.

## Clean code principles

- [Single Responsibility (SRP)](./clean-code/single-responsibility.md)
  – One reason to change per module/class/function.
- [Interface Segregation (ISP)](./clean-code/interface-segregation.md)
  – Small, capability-focused protocols; avoid "god" interfaces.
- [Dependency Inversion (DIP)](./clean-code/dependency-inversion.md)
  – Consumers define contracts; inject implementations for testability/portability.
- [Open–Closed (OCP)](./clean-code/open-closed.md)
  – Add behavior via extension, not edits to stable modules.
- [Liskov Substitution (LSP)](./clean-code/liskov-substitution.md)
  – Implementations honor the same contracts and error semantics.
- [Don't Repeat Yourself (DRY)](./clean-code/dry.md)
  – Centralize shared rules, conversions, and patterns.
- [Keep It Simple (KISS)](./clean-code/kiss.md)
  – Prefer the simplest working design; refactor when pressure appears.
