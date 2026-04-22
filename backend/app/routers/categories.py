from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.category import Category # TODO: Create this SQLModel

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/")
async def get_categories(session: Session = Depends(get_session)):
    categories = session.exec(select(Category)).all()
    return categories
    #return [{"id": 1, "name": "Sports"}, {"id": 2, "name": "Gaming"}]
