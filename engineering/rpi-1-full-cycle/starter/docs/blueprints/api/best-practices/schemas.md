# Schemas

## Goals

* Separate input from output — they evolve independently
* Never leak internal fields to clients
* Reusable base config across all models
* Explicit `response_model` on every route

## Separate Models Per Operation

```python
from pydantic import BaseModel, ConfigDict


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Input schemas ---

class TodoCreate(AppBaseModel):
    title: str


class TodoUpdate(AppBaseModel):
    title: str | None = None
    completed: bool | None = None


# --- Output schemas ---

class TodoResponse(AppBaseModel):
    id: str
    title: str
    completed: bool
    created_at: datetime
```

### BAD — Single model for everything

```python
class Todo(BaseModel):
    id: str | None = None        # Optional for create, present on read
    title: str
    completed: bool = False
    created_at: datetime | None = None
    internal_score: float = 0.0  # Leaks to client!
```

### GOOD — Purpose-specific schemas

```python
class TodoCreate(AppBaseModel):
    title: str                   # Only what the client sends


class TodoResponse(AppBaseModel):
    id: str                      # Only what the client sees
    title: str
    completed: bool
    created_at: datetime
    # internal_score intentionally excluded
```

## Paginated Responses

```python
from typing import Generic, TypeVar

T = TypeVar("T")


class PaginatedResponse(AppBaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

```python
@router.get("/")
async def list_todos(...) -> PaginatedResponse[TodoResponse]:
    ...
```

## Key Takeaways

- **One `Create`, one `Update`, one `Response` model per entity**
- **`AppBaseModel`** with `from_attributes=True` for ORM compatibility
- **Always set `response_model`** or return type annotation — never return raw dicts
- **Generic wrappers** for pagination, envelopes
