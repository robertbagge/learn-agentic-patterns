import json
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from models import Todo

_DATA_PATH = Path(__file__).parent / "todos.json"
_lock = threading.Lock()


def _read() -> list[Todo]:
    if not _DATA_PATH.exists():
        return []
    raw = json.loads(_DATA_PATH.read_text() or "[]")
    return [Todo(**item) for item in raw]


def _write(todos: list[Todo]) -> None:
    _DATA_PATH.write_text(
        json.dumps([t.model_dump() for t in todos], indent=2)
    )


def load_todos() -> list[Todo]:
    with _lock:
        return _read()


@contextmanager
def mutate() -> Iterator[list[Todo]]:
    with _lock:
        todos = _read()
        yield todos
        _write(todos)
