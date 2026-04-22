from __future__ import annotations

from sqlmodel import Session

from app.models.notification import Notification


class NotificationType:
    WELCOME = "welcome"
    EVENT_UPDATED = "event_updated"
    EVENT_CANCELLED = "event_cancelled"
    ATTENDANCE_JOINED = "attendance_joined"
    ATTENDANCE_LEFT = "attendance_left"
    USER_RATED = "user_rated"
    EVENT_RATED = "event_rated"


def create_notification(
    session: Session,
    user_id: int,
    content: str,
    notification_type: str = "general",
) -> Notification:
    notification = Notification(
        user_id=user_id,
        content=content,
        notification_type=notification_type,
    )
    session.add(notification)
    return notification


def create_notifications_bulk(
    session: Session,
    user_ids: list[int],
    content: str,
    notification_type: str = "general",
) -> list[Notification]:
    notifications = []
    for user_id in user_ids:
        notification = Notification(
            user_id=user_id,
            content=content,
            notification_type=notification_type,
        )
        session.add(notification)
        notifications.append(notification)
    return notifications
