from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.notifications import (
    NotificationType,
    create_notification,
    create_notifications_bulk,
)
from app.models.user import User
from app.models.event import Event
from app.models.attendance import Attendance

router = APIRouter(prefix="/events", tags=["events"])


class EventPayload(BaseModel):
    title: str
    description: str
    event_date: datetime
    max_capacity: int
    location: str
    latitude: float
    longitude: float
    category_id: int


class EventUpdatePayload(BaseModel):
    title: str | None = None
    description: str | None = None
    event_date: datetime | None = None
    max_capacity: int | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    category_id: int | None = None


def _get_attendee_user_ids(session: Session, event_id: int, exclude_user_id: int | None = None) -> list[int]:
    stmt = select(Attendance.user_id).where(Attendance.event_id == event_id)
    if exclude_user_id is not None:
        stmt = stmt.where(Attendance.user_id != exclude_user_id)
    return list(session.exec(stmt).all())


@router.get("/")
async def get_event_feed(session: Session = Depends(get_session)):
    events = session.exec(select(Event)).all()
    return events


@router.post("/")
async def create_new_event(
    payload: EventPayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    new_event = Event(
        **payload.model_dump(), creator_id=current_user.id, event_picture=b""
    )
    session.add(new_event)
    session.commit()
    session.refresh(new_event)
    return new_event


@router.patch("/{eventId}")
async def update_event(
    eventId: int,
    payload: EventUpdatePayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_data = payload.model_dump(exclude_unset=True)
    for key, value in event_data.items():
        setattr(event, key, value)

    session.add(event)

    # Notify attendees about the update
    attendee_ids = _get_attendee_user_ids(session, eventId, exclude_user_id=current_user.id)
    if attendee_ids:
        create_notifications_bulk(
            session,
            attendee_ids,
            f'"{event.title}" has been updated — check the new details.',
            NotificationType.EVENT_UPDATED,
        )

    session.commit()
    session.refresh(event)
    return event


@router.delete("/{eventId}")
async def delete_event(
    eventId: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_title = event.title

    # Notify attendees before deleting
    attendee_ids = _get_attendee_user_ids(session, eventId, exclude_user_id=current_user.id)
    if attendee_ids:
        create_notifications_bulk(
            session,
            attendee_ids,
            f'"{event_title}" has been cancelled.',
            NotificationType.EVENT_CANCELLED,
        )

    # Delete attendance rows, then the event
    attendances = session.exec(
        select(Attendance).where(Attendance.event_id == eventId)
    ).all()
    for attendance in attendances:
        session.delete(attendance)

    session.delete(event)
    session.commit()
    return {"message": "Event deleted successfully"}


@router.get("/{eventId}/attendees")
async def get_event_attendees(eventId: int, session: Session = Depends(get_session)):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    attendances = session.exec(
        select(Attendance).where(Attendance.event_id == eventId)
    ).all()

    attendees = []
    for attendance in attendances:
        user = session.get(User, attendance.user_id)
        if user:
            attendees.append({"id": user.id, "name": user.name})
    return attendees


@router.post("/{eventId}/attend")
async def attend_event(
    eventId: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = session.exec(
        select(Attendance).where(
            Attendance.event_id == eventId,
            Attendance.user_id == current_user.id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already attending this event")

    attendance = Attendance(user_id=current_user.id, event_id=eventId)
    session.add(attendance)

    # Notify event creator (unless the attendee is the creator)
    if event.creator_id != current_user.id:
        create_notification(
            session,
            event.creator_id,
            f'{current_user.name} joined your event "{event.title}".',
            NotificationType.ATTENDANCE_JOINED,
        )

    session.commit()
    session.refresh(attendance)
    return attendance


@router.delete("/{eventId}/attend")
async def leave_event(
    eventId: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    attendance = session.exec(
        select(Attendance).where(
            Attendance.event_id == eventId,
            Attendance.user_id == current_user.id,
        )
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Not attending this event")

    session.delete(attendance)
    session.commit()
    return {"message": "Left event successfully"}
