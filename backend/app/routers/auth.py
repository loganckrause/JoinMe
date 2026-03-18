from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthPayload(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(payload: AuthPayload):
    return {}


@router.post("/login")
async def login(payload: AuthPayload):
    return {}
