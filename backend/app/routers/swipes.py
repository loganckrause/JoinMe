from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session

# from app.models.swipe import Swipe # TODO: Create this SQLModel

router = APIRouter(prefix="/swipes", tags=["swipes"])


@router.post("/")
async def record_user_swipe(status: bool, session: Session = Depends(get_session)):
    # new_swipe = Swipe(status=status, user_id=1, event_id=2)
    # session.add(new_swipe)
    # session.commit()
    return {"status": "Swipe recorded", "liked": status}
