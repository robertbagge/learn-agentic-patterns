from core.exceptions import NotFound


class TodoNotFound(NotFound):
    def __init__(self, todo_id: str) -> None:
        super().__init__(f"Todo {todo_id} not found")
