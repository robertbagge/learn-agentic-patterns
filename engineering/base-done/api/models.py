from pydantic import BaseModel, Field


class Todo(BaseModel):
    id: str
    text: str
    completed: bool
    created_at: str


class TodoCreate(BaseModel):
    text: str


class TodoUpdate(BaseModel):
    text: str | None = Field(default=None)
    completed: bool | None = Field(default=None)
