from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session

from app.core.storage import generate_signed_url
from app.models.attendance import Attendance
from app.models.category import Category
from app.models.event import Event
from app.models.swipe import Swipe
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/swipes", tags=["swipes"])


@router.post("/")
async def record_user_swipe(
    status: bool,
    event_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing_attendance = session.exec(
        select(Attendance).where(
            Attendance.user_id == current_user.id,
            Attendance.event_id == event_id,
        )
    ).first()

    existing_swipes = session.exec(
        select(Swipe).where(
            Swipe.user_id == current_user.id,
            Swipe.event_id == event_id,
        )
    ).all()

    if event.creator_id == current_user.id:
        if not existing_attendance:
            session.add(Attendance(user_id=current_user.id, event_id=event_id))
            session.commit()

        return {
            "status": "Organizer is automatically accepted",
            "liked": True,
        }

    if not status:
        if existing_swipes:
            for swipe in existing_swipes:
                swipe.is_interested = False
                session.add(swipe)
            if existing_attendance:
                session.delete(existing_attendance)
            session.commit()
            return {"status": "Swipe updated", "liked": False}

        if existing_attendance:
            session.delete(existing_attendance)
            session.commit()
            return {"status": "Swipe updated", "liked": False}

        return {"status": "Swipe ignored", "liked": False}

    if existing_swipes:
        for swipe in existing_swipes:
            swipe.is_interested = True
            session.add(swipe)
    else:
        session.add(
            Swipe(
                user_id=current_user.id,
                event_id=event_id,
                is_interested=True,
            )
        )

    if not existing_attendance:
        session.add(Attendance(user_id=current_user.id, event_id=event_id))

    session.commit()

    return {"status": "Swipe recorded", "liked": True}


@router.get("/accepted")
async def get_user_swipes(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    accepted_swipe_event_ids = set(
        session.exec(
            select(Swipe.event_id).where(
                Swipe.user_id == current_user.id,
                Swipe.is_interested.is_(True),
            )
        ).all()
    )
    organizer_event_ids = set(
        session.exec(
            select(Event.id).where(Event.creator_id == current_user.id)
        ).all()
    )
    accepted_event_ids = accepted_swipe_event_ids | organizer_event_ids

    if not accepted_event_ids:
        return []

    rows = session.exec(
        select(Event, Category.name)
        .join(Category, Category.id == Event.category_id, isouter=True)
        .where(Event.id.in_(accepted_event_ids))
        .order_by(Event.event_date.desc())
    ).all()

    result: list[dict[str, object]] = []
    for event, category_name in rows:
        if event.event_picture:
            picture_name = (
                event.event_picture.decode("utf-8")
                if isinstance(event.event_picture, bytes)
                else event.event_picture
            )
            if picture_name:
                event.event_picture = generate_signed_url(picture_name)

        event_data = event.model_dump()
        event_data["category_name"] = category_name
        result.append(event_data)

    return result
