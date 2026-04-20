# Project Structure

## Goals

* Organize by domain, not by file type
* Keep route handlers thin — receive, delegate, respond
* Business logic in services with zero FastAPI imports
* Each domain module is self-contained

## Domain-Based Organization

```
api/
  todos/
    router.py          # Route handlers
    schemas.py         # Pydantic request/response models
    service.py         # Business logic
    dependencies.py    # Route-specific Depends()
    exceptions.py      # Domain exceptions
  core/
    config.py          # Pydantic BaseSettings
    database.py        # Engine, session factory
    exceptions.py      # Base exception classes + global handlers
  main.py              # App creation, router mounting, middleware
```

## Router Composition

```python
# todos/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("/")
async def list_todos(...): ...


@router.post("/", status_code=201)
async def create_todo(...): ...
```

```python
# main.py
from fastapi import FastAPI

from api.todos.router import router as todos_router

app = FastAPI()
app.include_router(todos_router, prefix="/api")
```

## Thin Routes

### BAD — Logic in the route handler

```python
@router.post("/", status_code=201)
async def create_todo(
    body: TodoCreate, db: SessionDep
) -> TodoResponse:
    # Validation, business rules, and persistence all here
    if len(body.title.strip()) == 0:
        raise HTTPException(400, "Title cannot be blank")
    todo = Todo(
        id=str(uuid4()),
        title=body.title.strip(),
        completed=False,
        created_at=datetime.now(UTC),
    )
    db.add(todo)
    await db.commit()
    return TodoResponse.model_validate(todo)
```

### GOOD — Route delegates to service

```python
@router.post("/", status_code=201)
async def create_todo(
    body: TodoCreate, service: TodoServiceDep
) -> TodoResponse:
    todo = await service.create(body)
    return TodoResponse.model_validate(todo)
```

```python
# todos/service.py — no FastAPI imports
class TodoService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: TodoCreate) -> Todo:
        title = data.title.strip()
        if not title:
            raise ValidationError("Title cannot be blank")
        todo = Todo(
            id=str(uuid4()),
            title=title,
            completed=False,
            created_at=datetime.now(UTC),
        )
        self.db.add(todo)
        await self.db.flush()
        return todo
```

## Key Takeaways

- **One domain directory per bounded context** (todos/, auth/, etc.)
- **Routes only translate HTTP ↔ service calls** — no business logic
- **Services are framework-agnostic** — testable without HTTP
- **Start flat, split into domains when a second domain appears**
