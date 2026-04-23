from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.category import Category

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/")
async def get_categories(session: Session = Depends(get_session)):
    categories = session.exec(select(Category)).all()
    return categories


@router.post("/")
async def create_category(category: Category, session: Session = Depends(get_session)):
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.post("/bulk")
async def create_categories(categories: list[Category], session: Session = Depends(get_session)):
    for category in categories:
        session.add(category)
    session.commit()
    return categories
