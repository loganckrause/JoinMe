from __future__ import annotations
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class UserRating(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    rater_id: int | None = Field(default=None, foreign_key="user.id")
    ratee_id: int = Field(foreign_key="user.id")
    score: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None)
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
