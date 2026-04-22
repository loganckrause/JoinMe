from __future__ import annotations

import logging
from typing import Optional

import httpx
from fastapi import BackgroundTasks
from sqlmodel import Session

from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

_TITLE_BY_TYPE = {
    "welcome": "Welcome to JoinMe!",
    "event_updated": "Event updated",
    "event_cancelled": "Event cancelled",
    "attendance_joined": "New attendee",
    "attendance_left": "An attendee left",
    "user_rated": "You got a rating",
    "event_rated": "Your event got a rating",
    "general": "JoinMe",
}


class NotificationType:
    WELCOME = "welcome"
    EVENT_UPDATED = "event_updated"
    EVENT_CANCELLED = "event_cancelled"
    ATTENDANCE_JOINED = "attendance_joined"
    ATTENDANCE_LEFT = "attendance_left"
    USER_RATED = "user_rated"
    EVENT_RATED = "event_rated"


async def send_push(token: str, title: str, body: str) -> None:
    payload = {"to": token, "title": title, "body": body, "sound": "default"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(EXPO_PUSH_URL, json=payload)
            if response.status_code >= 400:
                logger.warning(
                    "Expo push non-2xx: %s %s", response.status_code, response.text
                )
    except Exception as exc:
        logger.warning("Expo push failed: %s", exc)


def create_notification(
    session: Session,
    user_id: int,
    content: str,
    notification_type: str = "general",
    background_tasks: Optional[BackgroundTasks] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        content=content,
        notification_type=notification_type,
    )
    session.add(notification)

    if background_tasks is not None:
        user = session.get(User, user_id)
        if user and user.expo_push_token:
            title = _TITLE_BY_TYPE.get(notification_type, "JoinMe")
            background_tasks.add_task(send_push, user.expo_push_token, title, content)

    return notification


def create_notifications_bulk(
    session: Session,
    user_ids: list[int],
    content: str,
    notification_type: str = "general",
    background_tasks: Optional[BackgroundTasks] = None,
) -> list[Notification]:
    notifications = []
    title = _TITLE_BY_TYPE.get(notification_type, "JoinMe")
    for user_id in user_ids:
        notification = Notification(
            user_id=user_id,
            content=content,
            notification_type=notification_type,
        )
        session.add(notification)
        notifications.append(notification)

        if background_tasks is not None:
            user = session.get(User, user_id)
            if user and user.expo_push_token:
                background_tasks.add_task(
                    send_push, user.expo_push_token, title, content
                )

    return notifications
