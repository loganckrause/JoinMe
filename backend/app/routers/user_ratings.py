from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.user_rating import UserRating

router = APIRouter(prefix="/user-ratings", tags=["user-ratings"])


def get_user_rating_summary(session: Session, user_id: int) -> float:
    avg_score = session.exec(
        select(func.avg(UserRating.score)).where(UserRating.ratee_id == user_id)
    ).first()

    if avg_score is None:
        return 5.0

    return round(float(avg_score), 1)


class UserRatingCreatePayload(BaseModel):
    ratee_id: int
    score: int
    comment: Optional[str] = None


class UserRatingResponse(BaseModel):
    id: int
    rater_id: int
    ratee_id: int
    score: int
    comment: Optional[str] = None
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/")
async def get_user_ratings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all ratings given by the current user"""
    ratings = session.exec(
        select(UserRating).where(UserRating.rater_id == current_user.id)
    ).all()

    return ratings


@router.get("/received")
async def get_received_ratings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all ratings received by the current user"""
    ratings = session.exec(
        select(UserRating).where(UserRating.ratee_id == current_user.id)
    ).all()

    return ratings


@router.post("/")
async def create_user_rating(
    payload: UserRatingCreatePayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new user rating"""
    # Check if user is trying to rate themselves
    if payload.ratee_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")

    # Check if ratee exists
    ratee = session.get(User, payload.ratee_id)
    if not ratee:
        raise HTTPException(status_code=404, detail="User to rate not found")

    # Check if rating already exists
    # existing_rating = session.exec(
    #     select(UserRating).where(
    #         UserRating.rater_id == current_user.id,
    #         UserRating.ratee_id == payload.ratee_id,
    #     )
    # ).first()

    # if existing_rating:
    #     raise HTTPException(status_code=400, detail="You have already rated this user")

    # Validate score
    if payload.score < 1 or payload.score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    # Create rating
    rating = UserRating(
        rater_id=current_user.id,
        ratee_id=payload.ratee_id,
        score=payload.score,
        comment=payload.comment,
    )

    session.add(rating)
    session.commit()
    session.refresh(rating)

    return rating


@router.get("/{rating_id}")
async def get_user_rating(
    rating_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a specific user rating"""
    rating = session.get(UserRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    # Only allow viewing ratings given by or received by current user
    if rating.rater_id != current_user.id and rating.ratee_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this rating"
        )

    return rating


@router.put("/{rating_id}")
async def update_user_rating(
    rating_id: int,
    payload: UserRatingCreatePayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update a user rating (only the rater can update)"""
    rating = session.get(UserRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    if rating.rater_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own ratings")

    # Validate score
    if payload.score < 1 or payload.score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    # Update rating
    rating.score = payload.score
    rating.comment = payload.comment

    session.add(rating)
    session.commit()
    session.refresh(rating)

    return rating


@router.delete("/{rating_id}")
async def delete_user_rating(
    rating_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a user rating (only the rater can delete)"""
    rating = session.get(UserRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    if rating.rater_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own ratings")

    session.delete(rating)
    session.commit()

    return {"message": "Rating deleted successfully"}
