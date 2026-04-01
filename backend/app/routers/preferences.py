from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.category import Category

router = APIRouter(prefix="/preferences", tags=["preferences"])


class PreferenceCreatePayload(BaseModel):
    category_id: int


class PreferenceResponse(BaseModel):
    user_id: int
    category_id: int
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/")
async def get_user_preferences(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all preferences for the current user"""
    preferences = session.exec(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    ).all()

    result = []
    for pref in preferences:
        category = session.get(Category, pref.category_id)
        result.append(
            {
                "user_id": pref.user_id,
                "category_id": pref.category_id,
                "category_name": category.name if category else None,
            }
        )

    return result


@router.post("/")
async def add_preference(
    payload: PreferenceCreatePayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Add a preference for the current user"""
    # Check if category exists
    category = session.get(Category, payload.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if preference already exists
    existing = session.exec(
        select(UserPreference).where(
            (UserPreference.user_id == current_user.id)
            & (UserPreference.category_id == payload.category_id)
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Preference already exists")

    # Create new preference
    new_pref = UserPreference(
        user_id=current_user.id,
        category_id=payload.category_id,
    )
    session.add(new_pref)
    session.commit()
    session.refresh(new_pref)

    return {
        "user_id": new_pref.user_id,
        "category_id": new_pref.category_id,
        "category_name": category.name,
    }


@router.delete("/{category_id}")
async def remove_preference(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Remove a preference for the current user"""
    preference = session.exec(
        select(UserPreference).where(
            (UserPreference.user_id == current_user.id)
            & (UserPreference.category_id == category_id)
        )
    ).first()

    if not preference:
        raise HTTPException(status_code=404, detail="Preference not found")

    session.delete(preference)
    session.commit()

    return {"message": "Preference removed successfully"}


@router.post("/bulk")
async def bulk_add_preferences(
    payload: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Add multiple preferences at once"""
    category_ids = payload.get("category_ids", [])

    if not isinstance(category_ids, list):
        raise HTTPException(status_code=400, detail="category_ids must be a list")

    added_count = 0
    for category_id in category_ids:
        # Check if already exists
        existing = session.exec(
            select(UserPreference).where(
                (UserPreference.user_id == current_user.id)
                & (UserPreference.category_id == category_id)
            )
        ).first()

        if not existing:
            new_pref = UserPreference(
                user_id=current_user.id,
                category_id=category_id,
            )
            session.add(new_pref)
            added_count += 1

    session.commit()
    return {"added_count": added_count, "message": f"Added {added_count} preferences"}
