from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel, Column, LargeBinary, Relationship


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str
    password_hash: str
    bio: Optional[str] = Field(default=None)
    age: Optional[int] = Field(default=None, index=True)
    user_picture: bytes = Field(sa_column=Column(LargeBinary))
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationship to events created by this user
    # not used for the database, just for Python and the ORM
    created_events: list["Event"] = Relationship(back_populates="creator")
