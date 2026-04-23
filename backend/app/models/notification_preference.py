from __future__ import annotations

from sqlmodel import Field, SQLModel


class NotificationPreference(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    notification_type: str = Field(primary_key=True)
    in_app_enabled: bool = Field(default=True)
    push_enabled: bool = Field(default=True)
