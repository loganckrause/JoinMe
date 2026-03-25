from datetime import datetime, timezone

from sqlmodel import Field, SQLModel, Column, LargeBinary, Relationship


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    creator_id: int = Field(foreign_key="user.id")
    category_id: int = Field(foreign_key="category.id")
    title: str = Field(index=True)
    description: str
    event_date: datetime
    max_capacity: int
    location: str
    latitude: float
    longitude: float
    event_picture: bytes = Field(sa_column=Column(LargeBinary))
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationship linking back to the user who created it
    # not used for the database, just for Python and the ORM
    creator: "User" = Relationship(back_populates="created_events")
