from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.notifications import (
    NotificationType,
    create_notification,
    create_notifications_bulk,
)
from app.core.storage import upload_image_to_gcs, generate_signed_url
from app.core.location import geocode_address, haversine_distance
from app.models.user import User
from app.models.event import Event
from app.models.category import Category
from app.core.dependencies import get_current_user as get_auth_user
from app.models.attendance import Attendance

router = APIRouter(prefix="/events", tags=["events"])


class EventPayload(BaseModel):
    title: str
    description: str
    event_date: datetime
    max_capacity: int
    street: str
    city: str
    state: str
    zip: str
    category_id: int


class EventUpdatePayload(BaseModel):
    title: str | None = None
    description: str | None = None
    event_date: datetime | None = None
    max_capacity: int | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    category_id: int | None = None


def _get_attendee_user_ids(
    session: Session, event_id: int, exclude_user_id: int | None = None
) -> list[int]:
    stmt = select(Attendance.user_id).where(Attendance.event_id == event_id)
    if exclude_user_id is not None:
        stmt = stmt.where(Attendance.user_id != exclude_user_id)
    return list(session.exec(stmt).all())


@router.get("/")
async def get_event_feed(
    radius: float = 50.0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    category_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    stmt = select(Event, Category.name).join(
        Category, Category.id == Event.category_id, isouter=True
    )
    if category_id is not None:
        stmt = stmt.where(Event.category_id == category_id)
    if date_from is not None:
        stmt = stmt.where(Event.event_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(Event.event_date <= date_to)

    rows = session.exec(stmt).all()

    result = []
    for event, category_name in rows:
        dist = None
        if (
            current_user.latitude is not None
            and current_user.longitude is not None
            and event.latitude is not None
            and event.longitude is not None
        ):
            dist = haversine_distance(
                current_user.latitude,
                current_user.longitude,
                event.latitude,
                event.longitude,
            )
            if dist > radius:
                continue

        if event.event_picture:
            # Gracefully handle both old bytes format and new string format
            pic_name = (
                event.event_picture.decode("utf-8")
                if isinstance(event.event_picture, bytes)
                else event.event_picture
            )
            if pic_name:
                event.event_picture = generate_signed_url(pic_name)

        event_data = event.model_dump()
        event_data["category_name"] = category_name
        event_data["distance"] = round(dist, 1) if dist is not None else None
        result.append(event_data)

    return result


@router.get("/{eventId}")
async def get_event(
    eventId: int,
    session: Session = Depends(get_session),
):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    category = session.get(Category, event.category_id)

    if event.event_picture:
        pic_name = (
            event.event_picture.decode("utf-8")
            if isinstance(event.event_picture, bytes)
            else event.event_picture
        )
        if pic_name:
            event.event_picture = generate_signed_url(pic_name)

    event_data = event.model_dump()
    event_data["category_name"] = category.name if category else None
    return event_data


@router.post("/")
async def create_new_event(
    payload: EventPayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    full_address = f"{payload.street}, {payload.city}, {payload.state} {payload.zip}"
    lat, lon = await geocode_address(full_address)

    new_event = Event(
        **payload.model_dump(),
        creator_id=current_user.id,
        event_picture=None,
        latitude=lat,
        longitude=lon,
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

    if any(
        x is not None
        for x in [payload.street, payload.city, payload.state, payload.zip]
    ):
        n_street = payload.street if payload.street is not None else event.street
        n_city = payload.city if payload.city is not None else event.city
        n_state = payload.state if payload.state is not None else event.state
        n_zip = payload.zip if payload.zip is not None else event.zip
        new_address = f"{n_street}, {n_city}, {n_state} {n_zip}"
        lat, lon = await geocode_address(new_address)
        event.latitude = lat
        event.longitude = lon

    event_data = payload.model_dump(exclude_unset=True)
    for key, value in event_data.items():
        setattr(event, key, value)

    session.add(event)

    # Notify attendees about the update
    attendee_ids = _get_attendee_user_ids(
        session, eventId, exclude_user_id=current_user.id
    )
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
    attendee_ids = _get_attendee_user_ids(
        session, eventId, exclude_user_id=current_user.id
    )
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
            pic_url = None
            if user.user_picture:
                pic_name = (
                    user.user_picture.decode("utf-8")
                    if isinstance(user.user_picture, bytes)
                    else user.user_picture
                )
                if pic_name:
                    pic_url = generate_signed_url(pic_name)
            attendees.append({"id": user.id, "name": user.name, "photoUri": pic_url})
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

    event = session.get(Event, eventId)
    if event and event.creator_id != current_user.id:
        create_notification(
            session,
            event.creator_id,
            f'{current_user.name} left your event "{event.title}".',
            NotificationType.ATTENDANCE_LEFT,
        )

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

@router.get("/hosted")
async def get_hosted_events(
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    statement = select(Event).where(Event.creator_id == current_user.id)
    events = session.exec(statement).all()

    for event in events:
        if event.event_picture:
            pic_name = (
                event.event_picture.decode("utf-8")
                if isinstance(event.enevt_picture, bytes)
                else event.event_picture
            )
            if pic_name:
                event.event_picture = generate_signed_url(pic_name)

    return events
