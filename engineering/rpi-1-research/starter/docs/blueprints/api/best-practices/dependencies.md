# Dependencies

## Goals

* Use `Depends()` for all cross-cutting concerns
* `Annotated` aliases for clean route signatures
* Yield dependencies for resource cleanup
* Composable chains for auth, validation, DB sessions

## Database Session

```python
# core/database.py

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionFactory() as session:
        yield session
```

## Annotated Aliases

```python
from typing import Annotated

from fastapi import Depends

SessionDep = Annotated[AsyncSession, Depends(get_db)]
```

```python
# Route signature stays clean
@router.get("/{todo_id}")
async def get_todo(todo_id: str, db: SessionDep) -> TodoResponse:
    ...
```

## Reusable Validation Dependencies

```python
# todos/dependencies.py

async def valid_todo_id(
    todo_id: str, db: SessionDep
) -> Todo:
    todo = await db.get(Todo, todo_id)
    if not todo:
        raise NotFound(f"Todo {todo_id} not found")
    return todo


TodoDep = Annotated[Todo, Depends(valid_todo_id)]
```

```python
@router.get("/{todo_id}")
async def get_todo(todo: TodoDep) -> TodoResponse:
    return TodoResponse.model_validate(todo)


@router.patch("/{todo_id}")
async def update_todo(
    todo: TodoDep, body: TodoUpdate, service: TodoServiceDep
) -> TodoResponse:
    updated = await service.update(todo, body)
    return TodoResponse.model_validate(updated)
```

## Service Injection

```python
def get_todo_service(db: SessionDep) -> TodoService:
    return TodoService(db)


TodoServiceDep = Annotated[TodoService, Depends(get_todo_service)]
```

### BAD — Manual wiring in every handler

```python
@router.get("/{todo_id}")
async def get_todo(todo_id: str, db: SessionDep) -> TodoResponse:
    todo = await db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(404)
    return TodoResponse.model_validate(todo)


@router.patch("/{todo_id}")
async def update_todo(
    todo_id: str, body: TodoUpdate, db: SessionDep
) -> TodoResponse:
    todo = await db.get(Todo, todo_id)  # Duplicated lookup
    if not todo:
        raise HTTPException(404)       # Duplicated check
    ...
```

### GOOD — Composable dependencies

```python
@router.get("/{todo_id}")
async def get_todo(todo: TodoDep) -> TodoResponse:
    return TodoResponse.model_validate(todo)


@router.patch("/{todo_id}")
async def update_todo(
    todo: TodoDep, body: TodoUpdate, service: TodoServiceDep
) -> TodoResponse:
    updated = await service.update(todo, body)
    return TodoResponse.model_validate(updated)
```

## Key Takeaways

- **`yield` dependencies** clean up automatically — even on exceptions
- **`Annotated` aliases** keep route signatures readable
- **Validation dependencies** (`valid_todo_id`) eliminate duplicated lookups
- **Service dependencies** compose DB session → service in one chain
- **Dependencies are cached per-request** — same `get_db` call returns the same session
