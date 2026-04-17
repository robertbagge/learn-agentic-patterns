from fastapi import APIRouter, Response, status

from todos.dependencies import TodoServiceDep
from todos.schemas import TodoCreate, TodoResponse, TodoUpdate


router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("/")
def list_todos(service: TodoServiceDep) -> list[TodoResponse]:
    return [TodoResponse.model_validate(t) for t in service.list()]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_todo(body: TodoCreate, service: TodoServiceDep) -> TodoResponse:
    return TodoResponse.model_validate(service.create(body))


@router.patch("/{todo_id}")
def update_todo(todo_id: str, body: TodoUpdate, service: TodoServiceDep) -> TodoResponse:
    return TodoResponse.model_validate(service.update(todo_id, body))


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: str, service: TodoServiceDep) -> Response:
    service.delete(todo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
