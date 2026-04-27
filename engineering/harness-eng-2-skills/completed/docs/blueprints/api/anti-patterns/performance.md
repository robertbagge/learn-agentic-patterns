# Performance Anti-Patterns

## 1. N+1 queries

```python
# BAD — one query per todo to load its tags
@router.get("/")
async def list_todos(db: SessionDep):
    todos = (await db.execute(select(Todo))).scalars().all()
    for todo in todos:
        todo.tags = (
            await db.execute(select(Tag).where(Tag.todo_id == todo.id))
        ).scalars().all()  # N extra queries!
    return todos
```

**Why it hurts:** 100 todos = 101 queries. Latency scales linearly with
result count.

**Fix:** Use `selectinload` or `joinedload`:

```python
query = select(Todo).options(selectinload(Todo.tags))
todos = (await db.execute(query)).scalars().all()
# 2 queries total, regardless of count
```

## 2. No connection pooling

```python
# BAD — new engine per request
async def get_db():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        yield session
    await engine.dispose()
```

**Why it hurts:** TCP + TLS handshake on every request. Connection setup
takes 5-20ms — pooling eliminates this for all but the first request.

**Fix:** Create one engine at startup with pool settings:

```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)
```

## 3. Sync database driver in async code

```python
# BAD — psycopg2 blocks the event loop
engine = create_async_engine("postgresql://...")  # Wrong scheme!
# Should be "postgresql+asyncpg://..."
```

**Why it hurts:** Even though the engine says "async", a sync driver blocks
the event loop on every query. Throughput drops 3-5x compared to a true
async driver.

**Fix:** Use `postgresql+asyncpg://` with `asyncpg`, or `aiosqlite` for
SQLite.

## 4. `BaseHTTPMiddleware` stacking

```python
# BAD — each layer adds ~15% latency overhead
app.add_middleware(LoggingMiddleware)     # BaseHTTPMiddleware subclass
app.add_middleware(MetricsMiddleware)     # BaseHTTPMiddleware subclass
app.add_middleware(RequestIdMiddleware)   # BaseHTTPMiddleware subclass
app.add_middleware(TimingMiddleware)      # BaseHTTPMiddleware subclass
# Stacked: ~40% slower than raw ASGI middleware
```

**Why it hurts:** `BaseHTTPMiddleware` wraps the request/response body in
a way that adds overhead per layer. Stacking 3-4 layers can measurably
degrade throughput.

**Fix:** Keep middleware to a minimum. For performance-critical paths,
use pure ASGI middleware instead of `BaseHTTPMiddleware` subclasses.

## 5. Stdlib `json` instead of `orjson`

FastAPI defaults to Python's `json` module for response serialization.

**Why it hurts:** `orjson` is 20-50% faster and handles `datetime`,
`UUID`, and `numpy` types natively.

**Fix:**

```python
from fastapi.responses import ORJSONResponse

app = FastAPI(default_response_class=ORJSONResponse)
```

## 6. No pagination on list endpoints

```python
# BAD — loads entire table
@router.get("/")
async def list_todos(db: SessionDep):
    result = await db.execute(select(Todo))
    return result.scalars().all()  # 100k rows in memory
```

**Why it hurts:** Memory spikes, slow serialization, network saturation.
One client listing all records can degrade the service for everyone.

**Fix:** Always paginate:

```python
@router.get("/")
async def list_todos(
    db: SessionDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[TodoResponse]:
    offset = (page - 1) * page_size
    query = select(Todo).offset(offset).limit(page_size)
    ...
```
