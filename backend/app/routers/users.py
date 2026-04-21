from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user as get_auth_user
from app.core.storage import upload_image_to_gcs, generate_signed_url
from app.core.location import geocode_address
from app.models.user import User
from app.routers.user_ratings import get_user_rating_summary

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdatePayload(BaseModel):
    name: str | None = None
    bio: str | None = None
    age: int | None = None
    city: str | None = None


class UserRatingSummaryResponse(BaseModel):
    rating_score: float


class UserRatingSummaryResponse(BaseModel):
    rating_score: float


@router.get("/me")
async def read_current_user(
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    if current_user.user_picture:
        pic_name = (
            current_user.user_picture.decode("utf-8")
            if isinstance(current_user.user_picture, bytes)
            else current_user.user_picture
        )
        if pic_name:
            current_user.user_picture = generate_signed_url(pic_name)

    user_payload = current_user.model_dump()
    user_payload["rating_score"] = get_user_rating_summary(session, current_user.id)

    return user_payload


@router.patch("/me")
async def update_current_user(
    payload: UserUpdatePayload,
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    print(f"Incoming Profile Update Payload: {payload}")

    if payload.name is not None:
        current_user.name = payload.name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.age is not None:
        current_user.age = payload.age
    if payload.city is not None and (
        payload.city != current_user.city or current_user.latitude is None
    ):
        print(f"Attempting to geocode new city: {payload.city}")
        current_user.city = payload.city
        lat, lon = await geocode_address(payload.city)
        if lat is not None and lon is not None:
            current_user.latitude = lat
            current_user.longitude = lon

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


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

    user_payload = user.model_dump()
    user_payload["rating_score"] = get_user_rating_summary(session, user.id)


    return user_payload


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
