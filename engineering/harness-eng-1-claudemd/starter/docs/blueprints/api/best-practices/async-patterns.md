# Async Patterns

## Goals

* Never block the event loop
* Choose `async def` vs `def` deliberately
* Manage startup/shutdown resources via `lifespan`
* Pool connections, don't create per-request

## The Cardinal Rule

**Never call blocking I/O inside `async def`.** A single blocking call
stalls the entire event loop — all concurrent requests wait.

```python
# BAD — blocks the event loop
@router.get("/")
async def list_todos(db: SessionDep):
    result = requests.get("https://api.example.com")  # sync HTTP!
    ...

# GOOD — use async libraries
@router.get("/")
async def list_todos(db: SessionDep):
    async with httpx.AsyncClient() as client:
        result = await client.get("https://api.example.com")
    ...
```

## When to Use `async def` vs `def`

| Situation | Use | Why |
|-----------|-----|-----|
| Async DB driver (asyncpg) | `async def` | Yields control during I/O |
| Async HTTP client (httpx) | `async def` | Same |
| Sync-only library | `def` | FastAPI auto-runs in threadpool |
| CPU-bound computation | `def` | Runs in threadpool, doesn't block loop |

```python
# Sync-only library — use plain def
@router.get("/report")
def generate_report():
    return create_pdf_report()  # CPU-bound, runs in threadpool
```

## Lifespan Management

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
```

### BAD — Deprecated `on_event`

```python
@app.on_event("startup")
async def startup():
    await init_db()

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
```

## Connection Pooling

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,         # Persistent connections
    max_overflow=10,      # Burst capacity
    pool_pre_ping=True,   # Detect stale connections
)
```

### BAD — New connection per request

```python
async def get_db():
    engine = create_async_engine(DATABASE_URL)  # New engine every time!
    async with AsyncSession(engine) as session:
        yield session
    await engine.dispose()
```

## Background Tasks

```python
from fastapi import BackgroundTasks


@router.post("/", status_code=201)
async def create_todo(
    body: TodoCreate,
    service: TodoServiceDep,
    background_tasks: BackgroundTasks,
) -> TodoResponse:
    todo = await service.create(body)
    background_tasks.add_task(send_notification, todo)
    return TodoResponse.model_validate(todo)
```

Use `BackgroundTasks` for quick fire-and-forget (email, logging).
Use Celery or arq when tasks need retries, persistence, or take > 30s.

## Key Takeaways

- **`async def`** for async I/O, **`def`** for sync or CPU-bound work
- **`lifespan`** context manager replaces deprecated `on_event`
- **One engine, one pool** — created at startup, shared across requests
- **`BackgroundTasks`** for lightweight async work; task queues for heavy work
- **`asyncio.to_thread()`** to bridge sync code into async context when needed
