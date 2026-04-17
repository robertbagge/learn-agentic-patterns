from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Priority = Literal["low", "medium", "high"]


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TodoCreate(AppBaseModel):
    title: str = Field(min_length=1, max_length=200)
    priority: Priority = "medium"

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
    completed: bool | None = None

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
    completed: bool
    created_at: datetime
    updated_at: datetime
