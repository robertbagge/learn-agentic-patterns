# Error Handling

## Goals

* Services raise domain exceptions, never `HTTPException`
* One place maps domain errors to HTTP responses
* Consistent JSON error envelope across all endpoints
* Never leak stack traces, SQL, or file paths to clients

## Domain Exception Hierarchy

```python
# core/exceptions.py

class AppException(Exception):
    """Base for all domain exceptions."""

    def __init__(self, detail: str) -> None:
        self.detail = detail


class NotFound(AppException):
    pass


class AlreadyExists(AppException):
    pass


class ValidationError(AppException):
    pass


class PermissionDenied(AppException):
    pass
```

## Service Usage

```python
# todos/service.py — raises domain exceptions, not HTTPException

class TodoService:
    async def get(self, todo_id: str) -> Todo:
        todo = await self.db.get(Todo, todo_id)
        if not todo:
            raise NotFound(f"Todo {todo_id} not found")
        return todo

    async def create(self, data: TodoCreate) -> Todo:
        if not data.title.strip():
            raise ValidationError("Title cannot be blank")
        ...
```

## Global Exception Handlers

```python
# core/exceptions.py

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


STATUS_MAP = {
    NotFound: 404,
    AlreadyExists: 409,
    ValidationError: 422,
    PermissionDenied: 403,
}


def _error_response(
    status: int, detail: str, request: Request
) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={
            "error": {
                "code": status,
                "message": detail,
                "path": request.url.path,
            }
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        status = STATUS_MAP.get(type(exc), 400)
        return _error_response(status, exc.detail, request)

    @app.exception_handler(Exception)
    async def catch_all_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error("Unhandled error", exc_info=exc)
        return _error_response(500, "Internal server error", request)
```

### BAD — HTTPException scattered in services

```python
# Inside service layer — now coupled to FastAPI
async def get(self, todo_id: str) -> Todo:
    todo = await self.db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Not found")
    return todo
```

### GOOD — Domain exceptions + centralized handlers

```python
# Service raises domain exception
raise NotFound(f"Todo {todo_id} not found")

# Handler maps it to HTTP — one place, consistent format
```

## Key Takeaways

- **Domain exceptions are framework-agnostic** — services stay testable
- **One `register_exception_handlers` call** in `main.py` wires everything
- **Consistent envelope** — clients parse the same `{"error": {...}}` shape every time
- **Catch-all handler** logs the real error, returns a generic message
