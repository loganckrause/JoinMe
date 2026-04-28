"""
Seed script for adding test data to the JoinMe database.
Run this after database tables are created.

Usage: python seed_data.py
"""

import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, delete

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
from app.models.notification_preference import NotificationPreference
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
        # Clear existing data so the script can be safely run multiple times
        print("Clearing old data...")
        session.exec(delete(EventRating))
        session.exec(delete(UserRating))
        session.exec(delete(Attendance))
        session.exec(delete(Notification))
        session.exec(delete(NotificationPreference))
        session.exec(delete(Swipe))
        session.exec(delete(EventChat))
        session.exec(delete(UserPreference))
        session.exec(delete(Event))
        session.exec(delete(User))
        session.exec(delete(Category))
        session.commit()

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
                city="New York",
                user_picture=None,
            ),
            User(
                name="jane_smith",
                email="jane@example.com",
                password_hash=get_password_hash("password123"),
                bio="Fitness enthusiast and yogi",
                age=28,
                city="New York",
                user_picture=None,
            ),
            User(
                name="mike_jones",
                email="mike@example.com",
                password_hash=get_password_hash("password123"),
                bio="Music lover and tech geek",
                age=30,
                city="New York",
                user_picture=None,
            ),
            User(
                name="sarah_williams",
                email="sarah@example.com",
                password_hash=get_password_hash("password123"),
                bio="Artist and outdoor adventure seeker",
                age=26,
                city="New York",
                user_picture=None,
            ),
            User(
                name="alex_brown",
                email="alex@example.com",
                password_hash=get_password_hash("password123"),
                bio="Chef and food lover",
                age=32,
                city="New York",
                user_picture=None,
            ),
        ]
        for user in users:
            session.add(user)
        session.commit()

        # Add User Preferences
        print("Adding user preferences...")
        preferences_data = [
            (
                users[0].id,
                [categories[0].id, categories[1].id, categories[5].id],
            ),  # john_doe
            (
                users[1].id,
                [categories[3].id, categories[7].id, categories[8].id],
            ),  # jane_smith
            (
                users[2].id,
                [categories[2].id, categories[5].id, categories[8].id],
            ),  # mike_jones
            (
                users[3].id,
                [categories[4].id, categories[7].id, categories[0].id],
            ),  # sarah_williams
            (
                users[4].id,
                [categories[6].id, categories[8].id, categories[9].id],
            ),  # alex_brown
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
                creator_id=users[0].id,
                category_id=categories[0].id,
                title="Morning Jogging at Central Park",
                description="Let's go for an early morning jog at Central Park. All fitness levels welcome!",
                event_date=now + timedelta(days=3, hours=6),
                max_capacity=20,
                street="Central Park West",
                city="New York",
                state="NY",
                zip="10024",
                latitude=40.7829,
                longitude=-73.9654,
                event_picture=b"",
            ),
            Event(
                creator_id=users[1].id,
                category_id=categories[3].id,
                title="Yoga and Meditation Session",
                description="Join us for a relaxing yoga and meditation session. Bring your own mat!",
                event_date=now + timedelta(days=2, hours=18),
                max_capacity=15,
                street="123 Yoga Way",
                city="New York",
                state="NY",
                zip="10001",
                latitude=40.7580,
                longitude=-73.9855,
                event_picture=b"",
            ),
            Event(
                creator_id=users[2].id,
                category_id=categories[2].id,
                title="Live Jazz Night",
                description="Come enjoy live jazz music with great company and refreshments.",
                event_date=now + timedelta(days=5, hours=20),
                max_capacity=50,
                street="131 W 3rd St",
                city="New York",
                state="NY",
                zip="10012",
                latitude=40.7308,
                longitude=-74.0084,
                event_picture=b"",
            ),
            Event(
                creator_id=users[3].id,
                category_id=categories[4].id,
                title="Art Painting Workshop",
                description="Learn basic painting techniques. Materials provided. Beginners welcome!",
                event_date=now + timedelta(days=4, hours=14),
                max_capacity=25,
                street="456 Art Ave",
                city="New York",
                state="NY",
                zip="10013",
                latitude=40.7128,
                longitude=-74.0060,
                event_picture=b"",
            ),
            Event(
                creator_id=users[4].id,
                category_id=categories[6].id,
                title="Culinary Workshop - Italian Pasta",
                description="Learn to make authentic Italian pasta from scratch with Chef Alex.",
                event_date=now + timedelta(days=6, hours=19),
                max_capacity=12,
                street="789 Food St",
                city="New York",
                state="NY",
                zip="10014",
                latitude=40.7505,
                longitude=-73.9972,
                event_picture=b"",
            ),
            Event(
                creator_id=users[0].id,
                category_id=categories[1].id,
                title="Gaming Tournament - Mario Kart",
                description="Competitive Mario Kart tournament. Prizes for top 3!",
                event_date=now + timedelta(days=7, hours=19),
                max_capacity=40,
                street="321 Game Blvd",
                city="New York",
                state="NY",
                zip="10015",
                latitude=40.7489,
                longitude=-73.9680,
                event_picture=b"",
            ),
            Event(
                creator_id=users[1].id,
                category_id=categories[7].id,
                title="Hiking Adventure - Trail Day",
                description="Join us for an intermediate hiking trail. Bring water and snacks!",
                event_date=now + timedelta(days=8, hours=7),
                max_capacity=30,
                street="1 Trail Rd",
                city="Hudson Valley",
                state="NY",
                zip="12520",
                latitude=41.8500,
                longitude=-73.9500,
                event_picture=b"",
            ),
            Event(
                creator_id=users[2].id,
                category_id=categories[5].id,
                title="Tech Meetup - Web Development",
                description="Discussion on latest web development frameworks and tools.",
                event_date=now + timedelta(days=9, hours=18),
                max_capacity=60,
                street="987 Tech Park",
                city="New York",
                state="NY",
                zip="10016",
                latitude=40.7614,
                longitude=-73.9776,
                event_picture=b"",
            ),
        ]

        for event in events:
            session.add(event)
        session.commit()

        # Add Test Attendance
        print("Adding test attendance...")
        attendances = [
            Attendance(
                user_id=users[1].id,
                event_id=events[0].id,
                did_attend=True,
                prompted=True,
            ),
            Attendance(
                user_id=users[2].id,
                event_id=events[0].id,
                did_attend=True,
                prompted=True,
            ),
            Attendance(
                user_id=users[3].id,
                event_id=events[0].id,
                did_attend=False,
                prompted=True,
            ),
            Attendance(user_id=users[0].id, event_id=events[1].id),
            Attendance(user_id=users[4].id, event_id=events[1].id),
            Attendance(user_id=users[0].id, event_id=events[2].id),
            Attendance(user_id=users[1].id, event_id=events[2].id),
        ]
        for att in attendances:
            session.add(att)
        session.commit()

        # Add Test User Ratings
        print("Adding test user ratings...")
        user_ratings = [
            UserRating(
                rater_id=users[1].id,
                ratee_id=users[0].id,
                score=5,
                comment="Great host!",
            ),
            UserRating(
                rater_id=users[2].id, ratee_id=users[0].id, score=4, comment="Good jog."
            ),
            UserRating(
                rater_id=None,
                ratee_id=users[3].id,
                score=1,
                comment="Penalty for no-show at event",
            ),
        ]
        for ur in user_ratings:
            session.add(ur)
        session.commit()

        # Add Test Event Ratings
        print("Adding test event ratings...")
        event_ratings = [
            EventRating(
                user_id=users[1].id,
                event_id=events[0].id,
                score=5,
                review="Loved the morning jog!",
            ),
            EventRating(
                user_id=users[2].id,
                event_id=events[0].id,
                score=4,
                review="Nice weather, good pace.",
            ),
        ]
        for er in event_ratings:
            session.add(er)
        session.commit()

        print("✅ Database seeded successfully!")
        print(f"   - {len(categories)} categories added")
        print(f"   - {len(users)} test users added")
        print(
            f"   - {sum(len(cats) for _, cats in preferences_data)} preferences added"
        )
        print(f"   - {len(events)} test events added")
        print(f"   - {len(attendances)} attendances added")
        print(f"   - {len(user_ratings)} user ratings added")
        print(f"   - {len(event_ratings)} event ratings added")


if __name__ == "__main__":
    seed_data()
