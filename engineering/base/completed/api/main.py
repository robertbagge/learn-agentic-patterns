import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

import storage
from models import Todo, TodoCreate, TodoUpdate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/todos")
def list_todos() -> list[Todo]:
    return storage.load_todos()


@app.post("/todos", status_code=201)
def create_todo(payload: TodoCreate) -> Todo:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")
    todo = Todo(
        id=uuid.uuid4().hex,
        text=text,
        completed=False,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    with storage.mutate() as todos:
        todos.append(todo)
    return todo


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: str, payload: TodoUpdate) -> Todo:
    with storage.mutate() as todos:
        for i, t in enumerate(todos):
            if t.id == todo_id:
                updated = t.model_copy(
                    update={
                        k: v
                        for k, v in payload.model_dump(exclude_unset=True).items()
                    }
                )
                if updated.text is not None:
                    stripped = updated.text.strip()
                    if not stripped:
                        raise HTTPException(status_code=400, detail="text must not be empty")
                    updated = updated.model_copy(update={"text": stripped})
                todos[i] = updated
                return updated
    raise HTTPException(status_code=404, detail="todo not found")


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: str) -> Response:
    with storage.mutate() as todos:
        for i, t in enumerate(todos):
            if t.id == todo_id:
                todos.pop(i)
                return Response(status_code=204)
    raise HTTPException(status_code=404, detail="todo not found")
