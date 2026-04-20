from datetime import UTC, datetime
from uuid import uuid4

from core.storage import Storage
from todos.exceptions import InvalidReorder, TodoNotFound
from todos.schemas import ReorderRequest, Status, TodoCreate, TodoUpdate


PRIORITY_RANK = {"high": 3, "medium": 2, "low": 1}
STATUSES: tuple[Status, ...] = ("todo", "doing", "done")


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _next_position(items: list[dict], status: Status) -> int:
    positions = [t["position"] for t in items if t["status"] == status]
    return max(positions) + 1 if positions else 0


class TodoService:
    def __init__(self, storage: Storage) -> None:
        self._storage = storage

    def list(self) -> list[dict]:
        items = self._storage.load()
        if self._migrate(items):
            self._storage.save(items)
        return sorted(items, key=lambda t: (t["position"], t["created_at"]))

    def create(self, data: TodoCreate) -> dict:
        now = _now()
        items = self._storage.load()
        self._migrate(items)
        todo = {
            "id": str(uuid4()),
            "title": data.title,
            "priority": data.priority,
            "status": data.status,
            "position": _next_position(items, data.status),
            "created_at": now,
            "updated_at": now,
        }
        items.append(todo)
        self._storage.save(items)
        return todo

    def update(self, todo_id: str, data: TodoUpdate) -> dict:
        items = self._storage.load()
        self._migrate(items)
        for todo in items:
            if todo["id"] == todo_id:
                patch = data.model_dump(exclude_unset=True)
                status_changed = "status" in patch and patch["status"] != todo["status"]
                todo.update(patch)
                if status_changed and "position" not in patch:
                    others = [t for t in items if t["id"] != todo_id]
                    todo["position"] = _next_position(others, todo["status"])
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

    def reorder(self, body: ReorderRequest) -> list[dict]:
        items = self._storage.load()
        self._migrate(items)
        by_id = {t["id"]: t for t in items}
        for todo_id in body.ordered_ids:
            if todo_id not in by_id:
                raise InvalidReorder(f"unknown todo id: {todo_id}")
        now = _now()
        for index, todo_id in enumerate(body.ordered_ids):
            todo = by_id[todo_id]
            todo["status"] = body.status
            todo["position"] = index
            todo["updated_at"] = now
        self._storage.save(items)
        return sorted(items, key=lambda t: (t["position"], t["created_at"]))

    @staticmethod
    def _migrate(items: list[dict]) -> bool:
        needs = any("completed" in t or "status" not in t or "position" not in t for t in items)
        if not needs:
            return False
        for t in items:
            if "status" not in t:
                t["status"] = "done" if t.get("completed") else "todo"
            t.pop("completed", None)
        buckets: dict[str, list[dict]] = {s: [] for s in STATUSES}
        for t in items:
            buckets.setdefault(t["status"], []).append(t)
        for status, bucket in buckets.items():
            bucket.sort(key=lambda t: (-PRIORITY_RANK[t["priority"]], t["created_at"]))
            for index, t in enumerate(bucket):
                if t.get("position") != index:
                    t["position"] = index
        return True
