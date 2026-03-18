from fastapi import APIRouter

router = APIRouter(prefix="/swipes", tags=["swipes"])


@router.post("/")
async def record_user_swipe(status: bool):
    return None
