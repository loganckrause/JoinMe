from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session

# from app.models.message import Message # TODO: Create this SQLModel

router = APIRouter(prefix="/events/{eventId}/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


@router.get("/")
async def get_chat_messages(eventId: int, session: Session = Depends(get_session)):
    # messages = session.exec(select(Message).where(Message.event_id == eventId)).all()
    # return messages
    return [{"message": f"Mock message for event {eventId}"}]


@router.post("/")
async def send_chat_message(
    eventId: int, payload: ChatMessage, session: Session = Depends(get_session)
):
    # new_message = Message(event_id=eventId, message=payload.message)
    # session.add(new_message)
    # session.commit()
    # session.refresh(new_message)
    return {"status": "Message sent", "content": payload.message}
