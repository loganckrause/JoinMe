from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_session
from app.models.user import User
from app.core.location import geocode_address
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthPayload(BaseModel):
    username: str
    password: str
    email: str
    city: str


@router.post("/register")
async def register(payload: AuthPayload, session: Session = Depends(get_session)):
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.name == payload.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Geocode the user's city
    lat, lon = await geocode_address(payload.city)

    # Create new user
    new_user = User(
        name=payload.username,
        password_hash=get_password_hash(payload.password),
        email=payload.email,
        city=payload.city,
        latitude=lat,
        longitude=lon,
        user_picture=b"",  # Required by User model
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}


@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Session = Depends(get_session),
):
    # Find the user by username
    user = session.exec(select(User).where(User.name == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Create and return the real JWT
    access_token = create_access_token(data={"sub": user.name})
    return {"access_token": access_token, "token_type": "bearer"}
