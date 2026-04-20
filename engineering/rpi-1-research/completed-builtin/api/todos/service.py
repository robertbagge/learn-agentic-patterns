from datetime import UTC, datetime
from uuid import uuid4

from core.storage import Storage
from todos.exceptions import TodoNotFound
from todos.schemas import TodoCreate, TodoUpdate


PRIORITY_RANK = {"high": 3, "medium": 2, "low": 1}


def _now() -> str:
    return datetime.now(UTC).isoformat()


class TodoService:
    def __init__(self, storage: Storage) -> None:
        self._storage = storage

    def list(self) -> list[dict]:
        items = self._storage.load()
        return sorted(
            items,
            key=lambda t: (-PRIORITY_RANK[t["priority"]], t["created_at"]),
        )

    def create(self, data: TodoCreate) -> dict:
        now = _now()
        todo = {
            "id": str(uuid4()),
            "title": data.title,
            "priority": data.priority,
            "completed": False,
            "created_at": now,
            "updated_at": now,
        }
        items = self._storage.load()
        items.append(todo)
        self._storage.save(items)
        return todo

    def update(self, todo_id: str, data: TodoUpdate) -> dict:
        items = self._storage.load()
        for todo in items:
            if todo["id"] == todo_id:
                patch = data.model_dump(exclude_unset=True)
                todo.update(patch)
                todo["updated_at"] = _now()
                self._storage.save(items)
                return todo
        raise TodoNotFound(todo_id)

    def delete(self, todo_id: str) -> None:
        items = self._storage.load()
        remaining = [t for t in items if t["id"] != todo_id]
        if len(remaining) == len(items):
            raise TodoNotFound(todo_id)
        self._storage.save(remaining)
