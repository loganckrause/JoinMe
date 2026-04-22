from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.notifications import create_notification, NotificationType
from app.models.event import Event
from app.models.attendance import Attendance
from app.models.user import User
from app.models.user_rating import UserRating

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/cron/daily-prompt")
async def trigger_daily_attendance_prompts(session: Session = Depends(get_session)):
    # Find events that ended a day ago (for simplicity, we check events that are past and unprompted)
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(days=1)
    
    # We find attendances for events that happened at least 1 day ago and haven't been prompted
    stmt = select(Attendance, Event).join(Event).where(
        Event.event_date <= one_day_ago,
        Attendance.prompted == False
    )
    
    results = session.exec(stmt).all()
    count = 0
    for attendance, event in results:
        attendance.prompted = True
        session.add(attendance)
        
        # Create notification to prompt attendance
        # Using "attendance_prompt" type. The frontend will know to prompt yes/no.
        create_notification(
            session=session,
            user_id=attendance.user_id,
            content=f"Did you attend the event '{event.title}'?",
            notification_type="attendance_prompt",
            event_id=event.id
        )
        count += 1
        
    session.commit()
    return {"message": f"Sent {count} attendance prompts"}

class AttendanceConfirmPayload(BaseModel):
    did_attend: bool

@router.post("/events/{event_id}/confirm")
async def confirm_attendance(
    event_id: int,
    payload: AttendanceConfirmPayload,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Attendance).where(
        Attendance.event_id == event_id,
        Attendance.user_id == current_user.id
    )
    attendance = session.exec(stmt).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if attendance.did_attend is not None:
        return {"message": "Attendance already confirmed"}
        
    attendance.did_attend = payload.did_attend
    session.add(attendance)
    
    if payload.did_attend:
        # User attended. Ask them to rate others and the event.
        # Create a notification that leads to the rating screen
        event = session.get(Event, event_id)
        if event:
            create_notification(
                session=session,
                user_id=current_user.id,
                content=f"Please rate the event '{event.title}' and its participants.",
                notification_type="rate_event_prompt",
                event_id=event.id
            )
    else:
        # User didn't attend and didn't decline. Drop rating by 1 star (system penalty).
        # We simulate a 1-star penalty rating.
        penalty_rating = UserRating(
            rater_id=None, # System rating
            ratee_id=current_user.id,
            score=1,
            comment="Penalty for no-show at event"
        )
        session.add(penalty_rating)
        
    session.commit()
    return {"message": "Attendance confirmed"}
