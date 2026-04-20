from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from core.storage import JsonFileStorage, Storage
from todos.service import TodoService


TODOS_FILE = Path(__file__).resolve().parent.parent / "todos.json"


@lru_cache(maxsize=1)
def get_storage() -> Storage:
    return JsonFileStorage(TODOS_FILE)


def get_todo_service(storage: Annotated[Storage, Depends(get_storage)]) -> TodoService:
    return TodoService(storage)


TodoServiceDep = Annotated[TodoService, Depends(get_todo_service)]
