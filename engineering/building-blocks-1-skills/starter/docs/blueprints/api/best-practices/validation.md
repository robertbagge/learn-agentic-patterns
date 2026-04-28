# Validation

## Goals

* Declarative constraints via Pydantic, not manual checks in handlers
* Reusable `Annotated` type aliases for common patterns
* Cross-field validation with `@model_validator`
* DB-dependent validation in dependencies, not validators

## Field Validators

```python
from pydantic import BaseModel, field_validator


class TodoCreate(BaseModel):
    title: str

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip()

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v:
            raise ValueError("Title cannot be blank")
        return v
```

## Annotated Constraints

```python
from typing import Annotated

from pydantic import Field

# Reusable type aliases
NonEmptyStr = Annotated[str, Field(min_length=1, max_length=500)]
PositiveInt = Annotated[int, Field(gt=0)]
PageSize = Annotated[int, Field(ge=1, le=100)]
```

```python
class TodoCreate(BaseModel):
    title: NonEmptyStr
```

## Path and Query Parameters

```python
from fastapi import Path, Query


@router.get("/")
async def list_todos(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: PageSize = Query(default=20, description="Items per page"),
    completed: bool | None = Query(default=None, description="Filter by status"),
) -> PaginatedResponse[TodoResponse]:
    ...


@router.get("/{todo_id}")
async def get_todo(
    todo_id: str = Path(description="The todo's unique ID"),
) -> TodoResponse:
    ...
```

## Cross-Field Validation

```python
from pydantic import model_validator


class DateRange(BaseModel):
    start: date
    end: date

    @model_validator(mode="after")
    def end_after_start(self) -> "DateRange":
        if self.end < self.start:
            raise ValueError("end must be after start")
        return self
```

### BAD — Manual validation in route handlers

```python
@router.post("/")
async def create_todo(body: dict, db: SessionDep):
    title = body.get("title", "").strip()
    if not title:
        raise HTTPException(422, "Title required")
    if len(title) > 500:
        raise HTTPException(422, "Title too long")
    ...
```

### GOOD — Declarative constraints

```python
class TodoCreate(BaseModel):
    title: NonEmptyStr  # All validation handled by Pydantic


@router.post("/", status_code=201)
async def create_todo(
    body: TodoCreate, service: TodoServiceDep
) -> TodoResponse:
    return TodoResponse.model_validate(await service.create(body))
```

## Key Takeaways

- **Pydantic validates before your code runs** — handlers receive clean data
- **`Annotated` aliases** are reusable across models and parameters
- **`mode="before"`** for normalization (strip, lowercase), **`mode="after"`** for rules
- **DB-dependent checks** (uniqueness, existence) belong in dependencies, not validators
- **`Path()` and `Query()`** add OpenAPI docs + validation in one place
