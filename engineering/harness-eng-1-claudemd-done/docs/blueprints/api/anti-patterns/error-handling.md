# Error Handling Anti-Patterns

## 1. `HTTPException` in services

```python
# BAD — service layer coupled to FastAPI
class TodoService:
    async def get(self, todo_id: str) -> Todo:
        todo = await self.db.get(Todo, todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Not found")
        return todo
```

**Why it hurts:** Services become untestable without FastAPI. Can't reuse
in CLI tools, background tasks, or other frameworks.

**Fix:** Raise domain exceptions (`NotFound`). Map to HTTP in exception
handlers. See [best-practices/error-handling.md](../best-practices/error-handling.md).

## 2. Inconsistent error formats

```python
# Endpoint A returns:
{"detail": "Not found"}

# Endpoint B returns:
{"error": "Todo not found", "code": 404}

# Endpoint C returns:
{"message": "not found", "status": "error"}
```

**Why it hurts:** Clients can't write a single error parser. Frontend code
branches on response shape instead of error codes.

**Fix:** One error envelope everywhere:
`{"error": {"code": 404, "message": "...", "path": "/api/todos/123"}}`

## 3. Bare `except` that swallows errors

```python
# BAD — errors vanish silently
@router.post("/")
async def create_todo(body: TodoCreate, db: SessionDep):
    try:
        todo = Todo(**body.model_dump())
        db.add(todo)
        await db.commit()
    except Exception:
        pass  # Swallowed — client gets 200, nothing was saved
    return {"status": "ok"}
```

**Fix:** Let exceptions propagate to the global handler. If you must catch,
log and re-raise.

## 4. Leaking internals to clients

```python
# BAD — exposes stack trace and SQL
@app.exception_handler(Exception)
async def handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),         # "relation 'todos' does not exist"
            "traceback": traceback.format_exc(),  # Full stack trace!
        },
    )
```

**Why it hurts:** Attackers learn your table names, library versions, and
file paths.

**Fix:** Log the real error server-side. Return a generic message to clients.

## 5. No request/correlation IDs

When errors hit production, matching a client-reported error to server logs
is impossible without a shared identifier.

**Fix:** Add middleware that generates/propagates a request ID, include it
in every error response and log entry.

## 6. Generic "Something went wrong"

```python
# BAD — useless to the client
return JSONResponse(500, {"error": "Something went wrong"})
```

**Why it hurts:** Client can't distinguish retriable (server overload) from
non-retriable (bad data). Users see a dead end.

**Fix:** Include an error code, a human-readable message, and indicate
whether the operation is retriable.
