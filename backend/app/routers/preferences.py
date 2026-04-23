from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.notifications import MASTER_PREF_KEY, NotificationType
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.notification_preference import NotificationPreference
from app.models.category import Category

router = APIRouter(prefix="/preferences", tags=["preferences"])

# NotificationType values that the UI exposes (welcome is hidden — it's a one-shot)
NOTIFICATION_TYPES_UI = [
    NotificationType.EVENT_UPDATED,
    NotificationType.EVENT_CANCELLED,
    NotificationType.ATTENDANCE_JOINED,
    NotificationType.ATTENDANCE_LEFT,
    NotificationType.USER_RATED,
    NotificationType.EVENT_RATED,
]


class NotificationPreferenceUpdate(BaseModel):
    notification_type: str
    in_app_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None


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


@router.get("/user/{user_id}")
async def get_preferences_for_user(user_id: int, session: Session = Depends(get_session)):
    """Get all preferences for a specific user by ID."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    preferences = session.exec(
        select(UserPreference).where(UserPreference.user_id == user_id)
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


@router.get("/notifications")
async def get_notification_preferences(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get notification delivery preferences for the current user."""
    rows = session.exec(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    ).all()
    by_type = {row.notification_type: row for row in rows}

    master_row = by_type.get(MASTER_PREF_KEY)
    master = {
        "in_app_enabled": master_row.in_app_enabled if master_row else True,
        "push_enabled": master_row.push_enabled if master_row else True,
    }

    per_type = []
    for nt in NOTIFICATION_TYPES_UI:
        row = by_type.get(nt)
        per_type.append({
            "notification_type": nt,
            "in_app_enabled": row.in_app_enabled if row else True,
            "push_enabled": row.push_enabled if row else True,
        })

    return {"master": master, "per_type": per_type}


@router.patch("/notifications")
async def update_notification_preference(
    payload: NotificationPreferenceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Upsert a single notification preference row for the current user."""
    nt = payload.notification_type
    if nt != MASTER_PREF_KEY and nt not in NOTIFICATION_TYPES_UI:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid notification_type: {nt}",
        )

    if payload.in_app_enabled is None and payload.push_enabled is None:
        raise HTTPException(
            status_code=400,
            detail="At least one of in_app_enabled or push_enabled must be provided",
        )

    existing = session.exec(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.notification_type == nt,
        )
    ).first()

    if existing:
        if payload.in_app_enabled is not None:
            existing.in_app_enabled = payload.in_app_enabled
        if payload.push_enabled is not None:
            existing.push_enabled = payload.push_enabled
        session.add(existing)
    else:
        existing = NotificationPreference(
            user_id=current_user.id,
            notification_type=nt,
            in_app_enabled=payload.in_app_enabled if payload.in_app_enabled is not None else True,
            push_enabled=payload.push_enabled if payload.push_enabled is not None else True,
        )
        session.add(existing)

    session.commit()
    session.refresh(existing)

    return {
        "notification_type": existing.notification_type,
        "in_app_enabled": existing.in_app_enabled,
        "push_enabled": existing.push_enabled,
    }


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
