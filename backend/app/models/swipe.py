from __future__ import annotations
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Swipe(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    is_interested: bool
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
