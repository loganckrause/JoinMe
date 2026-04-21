from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.storage import upload_image_to_gcs, generate_signed_url
from app.core.location import geocode_address, haversine_distance
from app.models.user import User
from app.models.event import Event
from app.models.category import Category
from app.core.dependencies import get_current_user as get_auth_user
from app.models.user import User
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


@router.get("/")
async def get_event_feed(
    radius: float = 50.0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    rows = session.exec(
        select(Event, Category.name).join(
            Category, Category.id == Event.category_id, isouter=True
        )
    ).all()

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
    session.delete(event)
    session.commit()
    return {"message": "Event deleted successfully"}


@router.get("/{eventId}/attendees")
async def get_event_attendees(eventId: int, session: Session = Depends(get_session)):
    # Logic to fetch users linked to this event
    return [{"id": 1, "name": "Attendee 1"}]


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
    # Query the Attendance join table to find all events the user is attending
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
