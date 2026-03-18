from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/events", tags=["events"])


class EventPayload(BaseModel):
    title: str


@router.get("/")
async def get_event_feed():
    return []


@router.post("/")
async def create_new_event(payload: EventPayload):
    return {}


@router.patch("/{eventId}")
async def update_event(eventId: int):
    return {}


@router.delete("/{eventId}")
async def delete_event(eventId: int):
    return {}


@router.get("/{eventId}/attendees")
async def get_event_attendees(eventId: int):
    return []
