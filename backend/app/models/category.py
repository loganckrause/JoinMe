from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.user_preference import UserPreference


class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str

    # Relationships
    user_preferences: list["UserPreference"] = Relationship(back_populates="category")
