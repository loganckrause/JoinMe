from __future__ import annotations
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Notification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    content: str
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
