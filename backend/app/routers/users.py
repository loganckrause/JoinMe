from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user as get_auth_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdatePayload(BaseModel):
    name: str


@router.get("/me")
async def read_current_user(current_user: User = Depends(get_auth_user)):
    return current_user


@router.patch("/me")
async def update_current_user(
    payload: UserUpdatePayload,
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    current_user.name = payload.name
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.get("/me/events")
async def get_user_events():
    # TODO: Query an EventAttendee join table to find events for this user
    return []


@router.get("/{userId}")
async def get_user(userId: int, session: Session = Depends(get_session)):
    user = session.get(User, userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
