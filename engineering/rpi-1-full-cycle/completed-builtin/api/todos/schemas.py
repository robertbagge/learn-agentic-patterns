from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Priority = Literal["low", "medium", "high"]
Status = Literal["todo", "doing", "done"]


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TodoCreate(AppBaseModel):
    title: str = Field(min_length=1, max_length=200)
    priority: Priority = "medium"
    status: Status = "todo"

    @field_validator("title")
    @classmethod
    def _strip_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("title cannot be blank")
        return stripped


class TodoUpdate(AppBaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    priority: Priority | None = None
    status: Status | None = None
    position: int | None = Field(default=None, ge=0)

    @field_validator("title")
    @classmethod
    def _strip_title(cls, v: str | None) -> str | None:
        if v is None:
            return None
        stripped = v.strip()
        if not stripped:
            raise ValueError("title cannot be blank")
        return stripped


class TodoResponse(AppBaseModel):
    id: str
    title: str
    priority: Priority
    status: Status
    position: int
    created_at: datetime
    updated_at: datetime


class ReorderRequest(AppBaseModel):
    status: Status
    ordered_ids: list[str]
