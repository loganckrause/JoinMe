from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, col

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/")
async def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(col(Notification.created_at).desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return notifications


@router.get("/unread-count")
async def get_unread_count(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    ).all()
    return {"unread_count": len(notifications)}


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your notification")
    notification.is_read = True
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification


@router.post("/mark-all-read")
async def mark_all_read(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    ).all()
    for notification in notifications:
        notification.is_read = True
        session.add(notification)
    session.commit()
    return {"marked_read": len(notifications)}
