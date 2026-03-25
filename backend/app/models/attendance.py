from __future__ import annotations
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Attendance(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    check_in_time: datetime | None = Field(default=None)
