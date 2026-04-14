from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user as get_auth_user
from app.core.storage import upload_image_to_gcs, generate_signed_url
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdatePayload(BaseModel):
    name: str


@router.get("/me")
async def read_current_user(current_user: User = Depends(get_auth_user)):
    if current_user.user_picture:
        pic_name = (
            current_user.user_picture.decode("utf-8")
            if isinstance(current_user.user_picture, bytes)
            else current_user.user_picture
        )
        if pic_name:
            current_user.user_picture = generate_signed_url(pic_name)
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

    if user.user_picture:
        pic_name = (
            user.user_picture.decode("utf-8")
            if isinstance(user.user_picture, bytes)
            else user.user_picture
        )
        if pic_name:
            user.user_picture = generate_signed_url(pic_name)
    return user


@router.post("/me/picture")
async def upload_user_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    unique_filename = upload_image_to_gcs(file, folder="users")
    current_user.user_picture = unique_filename
    session.add(current_user)
    session.commit()

    signed_url = generate_signed_url(unique_filename)
    return {"message": "Profile picture uploaded successfully", "url": signed_url}
