# Architecture Anti-Patterns

## 1. God routers

```python
# BAD — 300+ lines, every domain in one file
# router.py
@router.get("/todos")
async def list_todos(...): ...

@router.post("/todos")
async def create_todo(...): ...

@router.get("/users")
async def list_users(...): ...

@router.post("/auth/login")
async def login(...): ...

# ...50 more endpoints
```

**Why it hurts:** Merge conflicts, impossible to navigate, no clear
ownership. Changing auth touches the same file as changing todos.

**Fix:** One router per domain: `todos/router.py`, `auth/router.py`.
Compose via `include_router` in `main.py`.

## 2. Business logic in route handlers

```python
# BAD — untestable without HTTP, unreusable
@router.post("/", status_code=201)
async def create_todo(body: TodoCreate, db: SessionDep):
    if len(body.title.strip()) == 0:
        raise HTTPException(422, "Title blank")
    existing = await db.execute(
        select(Todo).where(Todo.title == body.title)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Duplicate")
    todo = Todo(id=str(uuid4()), title=body.title.strip(), ...)
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    await send_notification(todo)
    return todo
```

**Why it hurts:** Testing requires spinning up a full HTTP stack. Logic
can't be reused from CLI tools or background jobs.

**Fix:** Extract to a service class. Route becomes:
`todo = await service.create(body)`.

## 3. Endpoint-calls-endpoint

```python
# BAD — one route handler calling another
@router.post("/todos/{todo_id}/complete")
async def complete_todo(todo_id: str, db: SessionDep):
    ...
    # Calls the notification endpoint internally
    await create_notification(
        Request(scope=...), NotificationCreate(...)
    )
```

**Why it hurts:** Circular dependencies, double auth checks, no
transactional consistency, hard to trace.

**Fix:** Both endpoints call a shared service function.

## 4. Circular imports

```python
# todos/service.py
from api.auth.service import AuthService  # auth depends on todos too!

# auth/service.py
from api.todos.service import TodoService  # ImportError!
```

**Fix:** Depend on protocols, not concrete classes. Or extract the shared
concern into a third module.

## 5. File-type organization

```python
# BAD — organized by type, not domain
api/
  models/
    todo.py, user.py, auth.py
  routes/
    todo.py, user.py, auth.py
  schemas/
    todo.py, user.py, auth.py
```

**Why it hurts:** Changing "todos" touches 3+ directories. Related code is
scattered. Each directory grows linearly with every new domain.

**Fix:** Organize by domain: `todos/` contains its own router, schemas,
models, service, and exceptions.

## 6. No service layer

```python
# BAD — routes talk directly to the database
@router.patch("/{todo_id}")
async def update_todo(todo_id: str, body: TodoUpdate, db: SessionDep):
    todo = await db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(404)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    await db.commit()
    return todo
```

**Why it hurts:** Business rules scatter across handlers. Validation lives
in one route but not another. No place for cross-cutting logic like audit
logging or event emission.

**Fix:** Introduce a service layer that owns business rules. Routes
delegate to it.
