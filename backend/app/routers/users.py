from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdatePayload(BaseModel):
    name: str


@router.get("/me")
async def get_current_user():
    return {}


@router.patch("/me")
async def update_current_user(payload: UserUpdatePayload):
    return {}


@router.get("/me/events")
async def get_user_events():
    return []


@router.get("/{userId}")
async def get_user(userId: int):
    return {}
