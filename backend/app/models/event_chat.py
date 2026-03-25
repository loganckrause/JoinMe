from __future__ import annotations
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class EventChat(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    user_id: int = Field(foreign_key="user.id")
    message: str
    sent_at: datetime | None = Field(default_factory=lambda: datetime.now(timezone.utc))
