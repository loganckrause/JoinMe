from sqlmodel import Field, SQLModel, create_engine, Session
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    connect_args=(
        {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
    ),
)


def create_db_and_tables():
    # Import models here so SQLModel knows about them before creating tables
    from app.models.attendance import Attendance
    from app.models.category import Category
    from app.models.event_chat import EventChat
    from app.models.event_rating import EventRating
    from app.models.event import Event
    from app.models.notification import Notification
    from app.models.swipe import Swipe
    from app.models.user_rating import UserRating
    from app.models.user import User
    from app.models.user_preference import UserPreference

    # Creates all tables defined as SQLModel subclasses
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


if __name__ == "__main__":
    create_db_and_tables()
    # You can now use sessions with this engine to perform CRUD operations
    with Session(engine) as session:
        # ... database operations ...
        pass
