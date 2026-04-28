from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
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
from app.core.location import geocode_address, haversine_distance
from app.core.security import verify_token
from app.models.user import User
from app.models.event import Event
from app.models.category import Category
from app.core.dependencies import get_current_user as get_auth_user
from app.models.attendance import Attendance
from app.models.swipe import Swipe
from app.models.event_rating import EventRating

router = APIRouter(prefix="/events", tags=["events"])
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


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
    radius: float = 50.0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    category_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    # Fetch events the user has already swiped right on
    accepted_event_ids = set(
        session.exec(
            select(Swipe.event_id).where(
                Swipe.user_id == current_user.id,
                Swipe.is_interested.is_(True),
            )
        ).all()
    )

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
        event_data["is_accepted"] = (
            event.creator_id == current_user.id or event.id in accepted_event_ids
        )
        result.append(event_data)

    return result


@router.get("/me/events")
async def get_user_events(
    current_user: User = Depends(get_auth_user),
    session: Session = Depends(get_session),
):
    statement = (
        select(Event, Category.name)
        .join(Attendance, Attendance.event_id == Event.id)
        .join(Category, Category.id == Event.category_id, isouter=True)
        .where(Attendance.user_id == current_user.id)
        .order_by(Event.event_date.asc())
    )
    rows = session.exec(statement).all()

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
        event_data["is_accepted"] = True
        result.append(event_data)

    return result


# ── RESOLVED: fixed typo event.enevt_picture → event.event_picture ──
@router.get("/hosted")
async def get_hosted_events(
    userId: int | None = None,
    session: Session = Depends(get_session),
):
    statement = (
        select(Event, Category.name)
        .join(Category, Category.id == Event.category_id, isouter=True)
        .where(Event.creator_id == userId)
        .order_by(Event.event_date.asc())
    )
    rows = session.exec(statement).all()

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
        event_data["is_accepted"] = True
        result.append(event_data)

    return result


@router.get("/{eventId}")
async def get_event(
    eventId: int,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(_get_optional_current_user),
):
    row = session.exec(
        select(Event, Category.name)
        .join(Category, Category.id == Event.category_id, isouter=True)
        .where(Event.id == eventId)
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
    event_data["is_accepted"] = bool(current_user) and (
        event.creator_id == current_user.id
        or event.id
        in {
            *session.exec(
                select(Swipe.event_id).where(
                    Swipe.user_id == current_user.id,
                    Swipe.is_interested.is_(True),
                )
            ).all()
        }
    )

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
    background_tasks: BackgroundTasks,
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

    attendee_ids = _get_attendee_user_ids(
        session, eventId, exclude_user_id=current_user.id
    )
    if attendee_ids:
        create_notifications_bulk(
            session,
            attendee_ids,
            f'"{event.title}" has been updated — check the new details.',
            NotificationType.EVENT_UPDATED,
            background_tasks=background_tasks,
        )

    session.commit()
    session.refresh(event)
    return event


@router.delete("/{eventId}")
async def delete_event(
    eventId: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    event = session.get(Event, eventId)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_title = event.title

    attendee_ids = _get_attendee_user_ids(
        session, eventId, exclude_user_id=current_user.id
    )
    if attendee_ids:
        create_notifications_bulk(
            session,
            attendee_ids,
            f'"{event_title}" has been cancelled.',
            NotificationType.EVENT_CANCELLED,
            background_tasks=background_tasks,
        )

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
            pic_url = None
            if user.user_picture:
                pic_name = (
                    user.user_picture.decode("utf-8")
                    if isinstance(user.user_picture, bytes)
                    else user.user_picture
                )
                if pic_name:
                    pic_url = generate_signed_url(pic_name)
                attendees.append(
                    {"id": user.id, "name": user.name, "user_picture": pic_url}
                )
    return attendees


@router.post("/{eventId}/attend")
async def attend_event(
    eventId: int,
    background_tasks: BackgroundTasks,
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

    if event.creator_id != current_user.id:
        create_notification(
            session,
            event.creator_id,
            f'{current_user.name} joined your event "{event.title}".',
            NotificationType.ATTENDANCE_JOINED,
            background_tasks=background_tasks,
        )

    session.commit()
    session.refresh(attendance)
    return attendance


@router.delete("/{eventId}/attend")
async def leave_event(
    eventId: int,
    background_tasks: BackgroundTasks,
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
            background_tasks=background_tasks,
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

    if event.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    unique_filename = upload_image_to_gcs(file, folder="events")
    event.event_picture = unique_filename
    session.add(event)
    session.commit()

    signed_url = generate_signed_url(unique_filename)
    return {"message": "Image uploaded successfully", "url": signed_url}
