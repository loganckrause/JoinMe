from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy import delete as sql_delete

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.notifications import (
    NotificationType,
    create_notification,
    create_notifications_bulk,
)
from app.core.storage import upload_image_to_gcs, generate_signed_url
from app.core.security import verify_token
from app.models.user import User
from app.models.event import Event
from app.models.category import Category
from app.core.dependencies import get_current_user as get_auth_user
from app.models.attendance import Attendance
from app.models.swipe import Swipe
from app.models.event_chat import EventChat
from app.models.event_rating import EventRating

router = APIRouter(prefix="/events", tags=["events"])
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


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


def _get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
    session: Session = Depends(get_session),
) -> User | None:
    if not token:
        return None

    try:
        payload = verify_token(token)
    except Exception:
        return None

    email: str | None = payload.get("sub")
    if email is None:
        return None

    return session.exec(select(User).where(User.email == email)).first()


@router.get("/")
async def get_event_feed(
    current_user: User = Depends(get_current_user),  session: Session = Depends(get_session)):
    accepted_event_ids = set(
        session.exec(
            select(Swipe.event_id).where(
                Swipe.user_id == current_user.id,
                Swipe.is_interested.is_(True),
            )
        ).all()
    )

    rows = session.exec(
        select(Event, Category.name).join(
            Category, Category.id == Event.category_id, isouter=True
        )
    ).all()

    result = []
    for event, category_name in rows:
        if event.event_picture:
            pic_name = (
                event.event_picture.decode("utf-8")
                if isinstance(event.event_picture, bytes)
                else event.event_picture
            )
            if pic_name:
                event.event_picture = generate_signed_url(pic_name)

        event_data = event.model_dump()
        event_data["category_name"] = category_name
        event_data["is_accepted"] = (
            event.creator_id == current_user.id or event.id in accepted_event_ids
        )
        result.append(event_data)

    return result


@router.get("/{eventId}")
async def get_event(
    eventId: int,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(_get_optional_current_user),
):
    row = session.exec(
        select(Event, Category.name).join(
            Category, Category.id == Event.category_id, isouter=True
        ).where(Event.id == eventId)
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    event, category_name = row

    if event.event_picture:
        pic_name = (
            event.event_picture.decode("utf-8")
            if isinstance(event.event_picture, bytes)
            else event.event_picture
        )
        if pic_name:
            event.event_picture = generate_signed_url(pic_name)

    event_data = event.model_dump()
    event_data["category_name"] = category_name
    event_data["is_accepted"] = (
        bool(current_user)
        and (event.creator_id == current_user.id or event.id in {
            *session.exec(
                select(Swipe.event_id).where(
                    Swipe.user_id == current_user.id,
                    Swipe.is_interested.is_(True),
                )
            ).all()
        })
    )

    return event_data


@router.post("/")
async def create_new_event(
    payload: EventPayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    new_event = Event(
        **payload.model_dump(), creator_id=current_user.id, event_picture=None
    )
    session.add(new_event)
    session.commit()
    session.refresh(new_event)

    existing_attendance = session.exec(
        select(Attendance).where(
            Attendance.user_id == current_user.id,
            Attendance.event_id == new_event.id,
        )
    ).first()
    if not existing_attendance:
        session.add(Attendance(user_id=current_user.id, event_id=new_event.id))
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

    # Delete dependent rows first so the parent event can be removed safely.
    session.exec(sql_delete(EventChat).where(EventChat.event_id == eventId))
    session.exec(sql_delete(EventRating).where(EventRating.event_id == eventId))
    session.exec(sql_delete(Swipe).where(Swipe.event_id == eventId))
    session.exec(sql_delete(Attendance).where(Attendance.event_id == eventId))

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



@router.post("/{eventId}/picture")
async def upload_event_picture(
    eventId: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Enforce that only the creator can edit the event's picture
    if event.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    unique_filename = upload_image_to_gcs(file, folder="events")
    event.event_picture = unique_filename
    session.add(event)
    session.commit()

    signed_url = generate_signed_url(unique_filename)
    return {"message": "Image uploaded successfully", "url": signed_url}


@router.get("/me/events")
async def get_user_events(
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    statement = (
        select(Event).join(Attendance).where(Attendance.user_id == current_user.id)
    )
    events = session.exec(statement).all()

    for event in events:
        if event.event_picture:
            pic_name = (
                event.event_picture.decode("utf-8")
                if isinstance(event.event_picture, bytes)
                else event.event_picture
            )
            if pic_name:
                event.event_picture = generate_signed_url(pic_name)

    return events
