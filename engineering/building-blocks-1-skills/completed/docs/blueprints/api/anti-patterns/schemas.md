# Schema Anti-Patterns

## 1. Raw `dict` instead of Pydantic models

```python
# BAD — no validation, no docs, no type safety
@router.post("/")
async def create_todo(body: dict):
    title = body.get("title", "")
    ...
```

**Why it hurts:** No input validation, no OpenAPI schema generation, no
editor autocompletion. Typos in field names silently pass through.

**Fix:** Always use Pydantic models for request bodies.

## 2. No `response_model`

```python
# BAD — leaks every field on the ORM model
@router.get("/{todo_id}")
async def get_todo(todo_id: str, db: SessionDep):
    todo = await db.get(Todo, todo_id)
    return todo  # internal_score, hashed_password, etc. all exposed
```

**Why it hurts:** Internal fields leak to clients. ORM model changes
silently alter the API contract. No output validation.

**Fix:** Always use a response model via return type annotation or
`response_model=`:

```python
@router.get("/{todo_id}")
async def get_todo(todo: TodoDep) -> TodoResponse:
    return TodoResponse.model_validate(todo)
```

## 3. Single model for create + update + response

```python
# BAD — can't evolve independently
class Todo(BaseModel):
    id: str | None = None        # Optional for create
    title: str
    completed: bool = False
    created_at: datetime | None = None  # Optional for create
```

**Why it hurts:** Adding a write-only field (e.g., `password`) forces it
into the response. Making a field required on create makes it required
on update. The model serves three masters and satisfies none.

**Fix:** Separate `TodoCreate`, `TodoUpdate`, `TodoResponse`.

## 4. Validators calling external services

```python
# BAD — DB call on every validation
class TodoCreate(BaseModel):
    category_id: str

    @field_validator("category_id")
    @classmethod
    def category_exists(cls, v: str) -> str:
        if not db.query(Category).get(v):  # DB call in validator!
            raise ValueError("Category not found")
        return v
```

**Why it hurts:** Validators run on the hot path with no access to
dependency injection. They may use stale connections or block the event loop.

**Fix:** Move DB-dependent checks into a `Depends()` function.

## 5. Pydantic models for internal-only data

```python
# BAD — Pydantic overhead for data that never crosses an API boundary
class InternalMetrics(BaseModel):
    request_count: int
    avg_latency: float
    p99_latency: float

# Construction overhead on every instantiation
metrics = InternalMetrics(request_count=0, avg_latency=0.0, p99_latency=0.0)
```

**Why it hurts:** Pydantic v2 model construction is ~6.5x slower than plain
dataclasses. For internal state that's never serialized or validated at API
boundaries, that overhead is waste — especially in hot loops or per-request
bookkeeping.

**Fix:** Use `@dataclass` or plain classes for internal-only data.

## 6. Optional everything

```python
# BAD — no way to distinguish "not provided" from "set to null"
class TodoUpdate(BaseModel):
    title: str | None = None
    completed: bool | None = None
    # Did the client send completed=None or just not include it?
```

**Fix:** Use a sentinel or Pydantic's `model_fields_set`:

```python
updated_fields = body.model_fields_set  # {"title"} — only what was sent
for field in updated_fields:
    setattr(todo, field, getattr(body, field))
```
