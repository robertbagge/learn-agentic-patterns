# Testing

## Goals

* Test the HTTP contract, not implementation details
* `dependency_overrides` as the primary test seam
* Async test client from day one
* Always clean up overrides in teardown

## Test Client Setup

```python
# conftest.py

import pytest
from httpx import ASGITransport, AsyncClient

from api.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test"
    ) as c:
        yield c
    app.dependency_overrides.clear()
```

## Overriding Dependencies

```python
# conftest.py

from api.core.database import get_db


@pytest.fixture
async def db_session():
    """In-memory or transaction-scoped session for tests."""
    async with TestSessionFactory() as session:
        yield session


@pytest.fixture(autouse=True)
def override_db(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
```

## Testing a Route

```python
async def test_create_todo(client: AsyncClient):
    response = await client.post(
        "/api/todos",
        json={"title": "Buy milk"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Buy milk"
    assert body["completed"] is False
    assert "id" in body


async def test_create_todo_blank_title(client: AsyncClient):
    response = await client.post(
        "/api/todos",
        json={"title": "  "},
    )

    assert response.status_code == 422
    assert "error" in response.json()
```

## Testing Error Cases

```python
async def test_get_todo_not_found(client: AsyncClient):
    response = await client.get("/api/todos/nonexistent")

    assert response.status_code == 404
    error = response.json()["error"]
    assert error["code"] == 404
    assert "not found" in error["message"].lower()
```

### BAD — Module mocking instead of dependency overrides

```python
# Fragile — coupled to import paths
@patch("api.todos.service.TodoService.create")
async def test_create_todo(mock_create, client):
    mock_create.return_value = Todo(...)
    ...
```

### GOOD — Dependency overrides

```python
# Override the service dependency — clean, explicit
def fake_service():
    service = TodoService(db=FakeSession())
    return service

app.dependency_overrides[get_todo_service] = fake_service
```

## Key Takeaways

- **`AsyncClient` + `ASGITransport`** — tests async code paths correctly
- **`dependency_overrides`** — FastAPI's built-in test seam, use it
- **Always `clear()` overrides** — prevents test pollution across test files
- **Test the HTTP contract** — status codes, response shapes, error formats
- **`pytest-asyncio`** with `asyncio_mode = "auto"` in `pyproject.toml`
