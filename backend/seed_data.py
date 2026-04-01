"""
Seed script for adding test data to the JoinMe database.
Run this after database tables are created.

Usage: python seed_data.py
"""

import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from sqlmodel import Session

# Add the project root to sys.path
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

# Import ALL models FIRST to register them in SQLModel registry
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

from app.core.database import engine, create_db_and_tables
from app.core.security import get_password_hash


def seed_data():
    """Add test data to the database"""

    # Create tables first
    print("Creating database tables...")
    create_db_and_tables()

    with Session(engine) as session:
        # Clear existing data (optional - comment out to preserve data)
        # session.exec(delete(UserPreference))
        # session.exec(delete(Event))
        # session.exec(delete(User))
        # session.exec(delete(Category))
        # session.commit()

        # Add Categories
        print("Adding categories...")
        categories = [
            Category(name="Sports"),
            Category(name="Gaming"),
            Category(name="Music"),
            Category(name="Fitness"),
            Category(name="Art"),
            Category(name="Technology"),
            Category(name="Cooking"),
            Category(name="Outdoor"),
            Category(name="Social"),
            Category(name="Learning"),
        ]
        for cat in categories:
            session.add(cat)
        session.commit()

        # Add Test Users
        print("Adding test users...")
        users = [
            User(
                name="john_doe",
                email="john@example.com",
                password_hash=get_password_hash("password123"),
                bio="Love sports and gaming",
                age=25,
                user_picture=b"",
            ),
            User(
                name="jane_smith",
                email="jane@example.com",
                password_hash=get_password_hash("password123"),
                bio="Fitness enthusiast and yogi",
                age=28,
                user_picture=b"",
            ),
            User(
                name="mike_jones",
                email="mike@example.com",
                password_hash=get_password_hash("password123"),
                bio="Music lover and tech geek",
                age=30,
                user_picture=b"",
            ),
            User(
                name="sarah_williams",
                email="sarah@example.com",
                password_hash=get_password_hash("password123"),
                bio="Artist and outdoor adventure seeker",
                age=26,
                user_picture=b"",
            ),
            User(
                name="alex_brown",
                email="alex@example.com",
                password_hash=get_password_hash("password123"),
                bio="Chef and food lover",
                age=32,
                user_picture=b"",
            ),
        ]
        for user in users:
            session.add(user)
        session.commit()

        # Add User Preferences
        print("Adding user preferences...")
        preferences_data = [
            (1, [1, 2, 6]),  # john_doe: Sports, Gaming, Technology
            (2, [4, 8, 9]),  # jane_smith: Fitness, Outdoor, Social
            (3, [3, 6, 9]),  # mike_jones: Music, Technology, Social
            (4, [5, 8, 1]),  # sarah_williams: Art, Outdoor, Sports
            (5, [7, 9, 10]),  # alex_brown: Cooking, Social, Learning
        ]

        for user_id, category_ids in preferences_data:
            for cat_id in category_ids:
                pref = UserPreference(user_id=user_id, category_id=cat_id)
                session.add(pref)
        session.commit()

        # Add Test Events
        print("Adding test events...")
        now = datetime.now(timezone.utc)
        events = [
            Event(
                creator_id=1,
                category_id=1,
                title="Morning Jogging at Central Park",
                description="Let's go for an early morning jog at Central Park. All fitness levels welcome!",
                event_date=now + timedelta(days=3, hours=6),
                max_capacity=20,
                location="Central Park, New York",
                latitude=40.7829,
                longitude=-73.9654,
                event_picture=b"",
            ),
            Event(
                creator_id=2,
                category_id=4,
                title="Yoga and Meditation Session",
                description="Join us for a relaxing yoga and meditation session. Bring your own mat!",
                event_date=now + timedelta(days=2, hours=18),
                max_capacity=15,
                location="Zenith Yoga Studio",
                latitude=40.7580,
                longitude=-73.9855,
                event_picture=b"",
            ),
            Event(
                creator_id=3,
                category_id=3,
                title="Live Jazz Night",
                description="Come enjoy live jazz music with great company and refreshments.",
                event_date=now + timedelta(days=5, hours=20),
                max_capacity=50,
                location="Blue Note Jazz Club",
                latitude=40.7308,
                longitude=-74.0084,
                event_picture=b"",
            ),
            Event(
                creator_id=4,
                category_id=5,
                title="Art Painting Workshop",
                description="Learn basic painting techniques. Materials provided. Beginners welcome!",
                event_date=now + timedelta(days=4, hours=14),
                max_capacity=25,
                location="Creative Studio Downtown",
                latitude=40.7128,
                longitude=-74.0060,
                event_picture=b"",
            ),
            Event(
                creator_id=5,
                category_id=7,
                title="Culinary Workshop - Italian Pasta",
                description="Learn to make authentic Italian pasta from scratch with Chef Alex.",
                event_date=now + timedelta(days=6, hours=19),
                max_capacity=12,
                location="Downtown Cooking School",
                latitude=40.7505,
                longitude=-73.9972,
                event_picture=b"",
            ),
            Event(
                creator_id=1,
                category_id=2,
                title="Gaming Tournament - Mario Kart",
                description="Competitive Mario Kart tournament. Prizes for top 3!",
                event_date=now + timedelta(days=7, hours=19),
                max_capacity=40,
                location="Arcade Plus Gaming Center",
                latitude=40.7489,
                longitude=-73.9680,
                event_picture=b"",
            ),
            Event(
                creator_id=2,
                category_id=8,
                title="Hiking Adventure - Trail Day",
                description="Join us for an intermediate hiking trail. Bring water and snacks!",
                event_date=now + timedelta(days=8, hours=7),
                max_capacity=30,
                location="Hudson Valley Trails",
                latitude=41.8500,
                longitude=-73.9500,
                event_picture=b"",
            ),
            Event(
                creator_id=3,
                category_id=6,
                title="Tech Meetup - Web Development",
                description="Discussion on latest web development frameworks and tools.",
                event_date=now + timedelta(days=9, hours=18),
                max_capacity=60,
                location="Tech Hub Conference Room",
                latitude=40.7614,
                longitude=-73.9776,
                event_picture=b"",
            ),
        ]

        for event in events:
            session.add(event)
        session.commit()

        print("✅ Database seeded successfully!")
        print(f"   - {len(categories)} categories added")
        print(f"   - {len(users)} test users added")
        print(
            f"   - {sum(len(cats) for _, cats in preferences_data)} preferences added"
        )
        print(f"   - {len(events)} test events added")


if __name__ == "__main__":
    seed_data()
