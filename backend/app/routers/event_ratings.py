from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.event_rating import EventRating

router = APIRouter(prefix="/event-ratings", tags=["event-ratings"])


class EventRatingCreatePayload(BaseModel):
    event_id: int
    score: int
    review: str


class EventRatingResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    score: int
    review: str
    sent_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/")
async def get_user_event_ratings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all event ratings given by the current user"""
    ratings = session.exec(
        select(EventRating).where(EventRating.user_id == current_user.id)
    ).all()

    return ratings


@router.get("/event/{event_id}")
async def get_event_ratings(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all ratings for a specific event"""
    # Check if event exists
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    ratings = session.exec(
        select(EventRating).where(EventRating.event_id == event_id)
    ).all()

    return ratings


@router.post("/")
async def create_event_rating(
    payload: EventRatingCreatePayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new event rating"""
    # Check if event exists
    event = session.get(Event, payload.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user already rated this event
    existing_rating = session.exec(
        select(EventRating).where(
            EventRating.user_id == current_user.id,
            EventRating.event_id == payload.event_id,
        )
    ).first()

    if existing_rating:
        raise HTTPException(status_code=400, detail="You have already rated this event")

    # Validate score
    if payload.score < 1 or payload.score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    # Create rating
    rating = EventRating(
        user_id=current_user.id,
        event_id=payload.event_id,
        score=payload.score,
        review=payload.review,
    )

    session.add(rating)
    session.commit()
    session.refresh(rating)

    return rating


@router.get("/{rating_id}")
async def get_event_rating(
    rating_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a specific event rating"""
    rating = session.get(EventRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    # Only allow viewing ratings given by current user
    if rating.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this rating"
        )

    return rating


@router.put("/{rating_id}")
async def update_event_rating(
    rating_id: int,
    payload: EventRatingCreatePayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update an event rating (only the rater can update)"""
    rating = session.get(EventRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    if rating.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own ratings")

    # Validate score
    if payload.score < 1 or payload.score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    # Update rating
    rating.score = payload.score
    rating.review = payload.review

    session.add(rating)
    session.commit()
    session.refresh(rating)

    return rating


@router.delete("/{rating_id}")
async def delete_event_rating(
    rating_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete an event rating (only the rater can delete)"""
    rating = session.get(EventRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    if rating.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own ratings")

    session.delete(rating)
    session.commit()

    return {"message": "Rating deleted successfully"}
