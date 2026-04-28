# Dependency Anti-Patterns

## 1. Heavy computation in `Depends()`

```python
# BAD — runs on EVERY request to this route
async def get_analytics(db: SessionDep) -> Analytics:
    result = await db.execute(
        text("SELECT ... FROM events GROUP BY ...")  # Expensive query
    )
    return Analytics.from_rows(result.all())


@router.get("/dashboard")
async def dashboard(analytics: Annotated[Analytics, Depends(get_analytics)]):
    ...
```

**Why it hurts:** Dependencies run before the handler on every request.
Expensive setup that should be cached or async-background runs inline.

**Fix:** Cache results (Redis, `lru_cache`), or compute in a background
task and serve from cache.

## 2. Missing cleanup on `yield` dependencies

```python
# BAD — connection leaks on exception
async def get_db():
    session = SessionFactory()
    yield session
    await session.close()  # Never reached if handler raises!
```

**Why it hurts:** If the route handler raises an exception, code after
`yield` doesn't run. Connections leak until the pool is exhausted.

**Fix:** Use `async with` or `try/finally`:

```python
async def get_db():
    async with SessionFactory() as session:
        yield session
```

FastAPI guarantees the `async with` block's `__aexit__` runs even on
exceptions.

## 3. Global mutable state instead of DI

```python
# BAD — module-level singleton, untestable
# database.py
db = Database("postgresql://...")

# routes.py
from database import db

@router.get("/")
async def list_todos():
    return await db.fetch_all("SELECT * FROM todos")
```

**Why it hurts:** Can't override in tests. Can't switch implementations.
Import-time side effects make modules hard to load in isolation.

**Fix:** Use `Depends()` and `dependency_overrides`:

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionFactory() as session:
        yield session

# Tests: app.dependency_overrides[get_db] = fake_db
```

## 4. Forgetting to clear overrides in tests

```python
# BAD — override leaks into subsequent tests
def test_create_todo(client):
    app.dependency_overrides[get_db] = lambda: fake_session
    response = client.post(...)
    assert response.status_code == 201
    # No cleanup! Next test uses fake_session too
```

**Why it hurts:** Tests pass individually but fail when run together.
Order-dependent failures are the hardest to debug.

**Fix:** Always clear in fixture teardown:

```python
@pytest.fixture(autouse=True)
def reset_overrides():
    yield
    app.dependency_overrides.clear()
```

## 5. Circular dependency chains

```python
# BAD — A depends on B depends on A
async def get_auth(user: Annotated[User, Depends(get_user)]) -> Auth: ...
async def get_user(auth: Annotated[Auth, Depends(get_auth)]) -> User: ...
```

**Why it hurts:** FastAPI raises a runtime error on startup. In more subtle
cases, it causes infinite recursion.

**Fix:** Break the cycle. Usually one dependency should accept a more
primitive input (e.g., `get_user` takes a token string, not an `Auth`
object).
