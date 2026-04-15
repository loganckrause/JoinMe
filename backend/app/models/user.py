from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user_preference import UserPreference


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str
    password_hash: str
    bio: Optional[str] = Field(default=None)
    age: Optional[int] = Field(default=None, index=True)
    user_picture: str | None = Field(default=None)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    created_events: list["Event"] = Relationship(back_populates="creator")
    preferences: list["UserPreference"] = Relationship(back_populates="user")
