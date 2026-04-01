from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.category import Category


class UserPreference(SQLModel, table=True):
    """User preference linking a user to event categories"""

    user_id: int = Field(foreign_key="user.id", primary_key=True)
    category_id: int = Field(foreign_key="category.id", primary_key=True)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="preferences")
    category: Optional["Category"] = Relationship(back_populates="user_preferences")
