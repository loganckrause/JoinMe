from __future__ import annotations
from sqlmodel import Field, SQLModel


class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
