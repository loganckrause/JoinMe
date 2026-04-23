from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import Column
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.user import User


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    creator_id: int = Field(foreign_key="user.id")
    category_id: int = Field(foreign_key="category.id")
    title: str = Field(index=True)
    description: str
    event_date: datetime
    max_capacity: int
    street: str
    city: str
    state: str
    zip: str
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    event_picture: str | None = Field(default=None, sa_column=Column(LONGTEXT))
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationship linking back to the user who created it
    # not used for the database, just for Python and the ORM
    creator: "User" = Relationship(back_populates="created_events")
