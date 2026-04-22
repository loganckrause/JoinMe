import json
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import EmailStr
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_session
from app.core.storage import generate_signed_url, upload_image_to_gcs
from app.models.category import Category
from app.core.notifications import NotificationType, create_notification
from app.models.user import User
from app.core.location import geocode_address
from app.models.user_preference import UserPreference
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(
    email: Annotated[EmailStr, Form(...)],
    password: Annotated[str, Form(...)],
    full_name: Annotated[str, Form(...)],
    age: Annotated[int, Form(...)],
    bio: Annotated[str, Form(...)],
    city: Annotated[str, Form(...)],
    category_ids: Annotated[str, Form(...)],
    profile_picture: Annotated[UploadFile, File(...)],
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    if not password.strip():
        raise HTTPException(status_code=400, detail="Password cannot be empty")
    if not city.strip():
        raise HTTPException(status_code=400, detail="City cannot be empty")
    if not full_name.strip():
        raise HTTPException(status_code=400, detail="Full name cannot be empty")

    if age <= 0:
        raise HTTPException(status_code=400, detail="Age must be greater than 0")

    if not bio.strip():
        raise HTTPException(status_code=400, detail="Bio cannot be empty")

    try:
        parsed_category_ids = json.loads(category_ids)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="category_ids must be a JSON array of integers",
        ) from exc

    if not isinstance(parsed_category_ids, list):
        raise HTTPException(status_code=400, detail="category_ids must be a list")

    normalized_category_ids = []
    for value in parsed_category_ids:
        if not isinstance(value, int):
            raise HTTPException(
                status_code=400,
                detail="category_ids must contain only integers",
            )
        normalized_category_ids.append(value)

    unique_category_ids = list(dict.fromkeys(normalized_category_ids))

    if len(unique_category_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one interest must be selected",
        )

    if len(unique_category_ids) > 5:
        raise HTTPException(
            status_code=400,
            detail="You can select up to 5 interests",
        )

    existing_email = session.exec(select(User).where(User.email == str(email))).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    categories = session.exec(
        select(Category).where(Category.id.in_(unique_category_ids))
    ).all()
    found_category_ids = {category.id for category in categories}
    missing_category_ids = [
        category_id
        for category_id in unique_category_ids
        if category_id not in found_category_ids
    ]

    if missing_category_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category IDs: {missing_category_ids}",
        )

    uploaded_picture_key = upload_image_to_gcs(profile_picture, folder="users")

    # Geocode the user's city
    lat, lon = await geocode_address(city.strip())

    try:
        new_user = User(
            name=full_name.strip(),
            password_hash=get_password_hash(password),
            email=str(email),
            age=age,
            bio=bio.strip(),
            city=city.strip(),
            latitude=lat,
            longitude=lon,
            user_picture=uploaded_picture_key,
        )
        session.add(new_user)
        session.flush()

        for category_id in unique_category_ids:
            session.add(
                UserPreference(
                    user_id=new_user.id,
                    category_id=category_id,
                )
            )

        session.commit()
        session.refresh(new_user)
    except Exception:
        session.rollback()
        raise

    access_token = create_access_token(data={"sub": new_user.email})
    signed_picture_url = (
        generate_signed_url(new_user.user_picture) if new_user.user_picture else None
    )

    if age <= 0:
        raise HTTPException(status_code=400, detail="Age must be greater than 0")

    if not bio.strip():
        raise HTTPException(status_code=400, detail="Bio cannot be empty")

    try:
        parsed_category_ids = json.loads(category_ids)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="category_ids must be a JSON array of integers",
        ) from exc

    if not isinstance(parsed_category_ids, list):
        raise HTTPException(status_code=400, detail="category_ids must be a list")

    normalized_category_ids = []
    for value in parsed_category_ids:
        if not isinstance(value, int):
            raise HTTPException(
                status_code=400,
                detail="category_ids must contain only integers",
            )
        normalized_category_ids.append(value)

    unique_category_ids = list(dict.fromkeys(normalized_category_ids))

    if len(unique_category_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one interest must be selected",
        )

    if len(unique_category_ids) > 5:
        raise HTTPException(
            status_code=400,
            detail="You can select up to 5 interests",
        )

    existing_email = session.exec(select(User).where(User.email == str(email))).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    categories = session.exec(
        select(Category).where(Category.id.in_(unique_category_ids))
    ).all()
    found_category_ids = {category.id for category in categories}
    missing_category_ids = [
        category_id
        for category_id in unique_category_ids
        if category_id not in found_category_ids
    ]

    if missing_category_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category IDs: {missing_category_ids}",
        )

    uploaded_picture_key = upload_image_to_gcs(profile_picture, folder="users")

    try:
        new_user = User(
            name=full_name.strip(),
            password_hash=get_password_hash(password),
            email=str(email),
            age=age,
            bio=bio.strip(),
            user_picture=uploaded_picture_key,
        )
        session.add(new_user)
        session.flush()

        for category_id in unique_category_ids:
            session.add(
                UserPreference(
                    user_id=new_user.id,
                    category_id=category_id,
                )
            )

        session.commit()
        session.refresh(new_user)
    except Exception:
        session.rollback()
        raise

    access_token = create_access_token(data={"sub": new_user.email})
    signed_picture_url = (
        generate_signed_url(new_user.user_picture) if new_user.user_picture else None
    )

    create_notification(
        session,
        new_user.id,
        "Welcome to JoinMe! Start exploring events near you.",
        NotificationType.WELCOME,
        background_tasks=background_tasks,
    )
    session.commit()
    return {
        "message": "User created successfully",
        "user_id": new_user.id,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "bio": new_user.bio,
            "age": new_user.age,
            "city": new_user.city,
            "latitude": new_user.latitude,
            "longitude": new_user.longitude,
            "user_picture": signed_picture_url,
        },
    }


@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Session = Depends(get_session),
):
    # Find the user by email
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Create and return the real JWT
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
