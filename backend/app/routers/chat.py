from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/events/{eventId}/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


@router.get("/")
async def get_chat_messages(eventId: int):
    return []


@router.post("/")
async def send_chat_message(eventId: int, payload: ChatMessage):
    return {}
