import sys
from pathlib import Path
from sqlmodel import Session, select

# Add the project root to sys.path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

from app.core.database import engine
from app.models.event import Event
from app.models.notification import Notification
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.category import Category


def create_test_poll():
    with Session(engine) as session:
        # Find the actual users and events dynamically
        user = session.exec(select(User).where(User.name == "john_doe")).first()
        event = session.exec(
            select(Event).where(Event.title == "Morning Jogging at Central Park")
        ).first()

        notif = Notification(
            user_id=user.id,
            event_id=event.id,
            content="Did you attend Morning Jogging at Central Park?",
            notification_type="event_attendance_poll",
        )
        session.add(notif)
        session.commit()
        print(
            f"✅ Test poll notification created for {user.name} for event '{event.title}'!"
        )


if __name__ == "__main__":
    create_test_poll()
