import sys
import uuid
import io
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.dialects.sqlite import base as sqlite_base
from sqlalchemy import String, types

# Add the project root to the Python path to allow for absolute imports
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

# Override database URL for testing BEFORE any app imports
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_joinme.db"


def visit_LONGTEXT(self, type_, **kw):
    """Map LONGTEXT to TEXT for SQLite compatibility in tests"""
    return "TEXT"

sqlite_base.SQLiteTypeCompiler.visit_LONGTEXT = visit_LONGTEXT

from app.main import app
from app.core.database import create_db_and_tables
from app.core.database import engine
from app.models.category import Category
from sqlmodel import Session, select

# Ensure DB schema exists before tests run
create_db_and_tables()

# Initialize the test client using your FastAPI app
client = TestClient(app)


def ensure_categories_exist():
    with Session(engine) as session:
        existing_categories = session.exec(select(Category)).all()
        if existing_categories:
            return

        categories = [
            Category(name="Sports"),
            Category(name="Gaming"),
            Category(name="Music"),
            Category(name="Fitness"),
            Category(name="Art"),
        ]
        for category in categories:
            session.add(category)
        session.commit()


def register_user(username: str, password: str, email: str):
    ensure_categories_exist()
    return client.post(
        "/auth/register",
        data={
            "email": email,
            "password": password,
            "full_name": username,
            "age": "24",
            "bio": "Test bio",
            "city": "Test City",
            "category_ids": json.dumps([4, 5]),
        },
        files={
            "profile_picture": ("avatar.jpg", io.BytesIO(b"fake-image"), "image/jpeg")
        },
    )


def create_and_login_user(username: str, password: str):
    email = f"{username}@example.com"
    register_resp = register_user(username=username, password=password, email=email)
    assert register_resp.status_code == 200

    login_resp = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == 200

    return {
        "user_id": register_resp.json().get("user_id"),
        "token": login_resp.json().get("access_token"),
    }


@pytest.fixture(scope="function")
def test_user_token_and_id():
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "Password123!"
    email = f"{username}@example.com"

    register_resp = register_user(username=username, password=password, email=email)
    assert register_resp.status_code == 200
    user_id = register_resp.json().get("user_id")
    assert user_id is not None
    assert register_resp.json().get("access_token") is not None

    login_resp = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json().get("access_token")
    assert token is not None

    return {"token": token, "user_id": user_id}


def auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


def test_get_categories():
    response = client.get("/categories/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_chat_endpoints():
    get_resp = client.get("/events/1/chat/")
    assert get_resp.status_code == 200

    post_resp = client.post("/events/1/chat/")
    assert post_resp.status_code == 422


def test_preferences_routes(test_user_token_and_id):
    token = test_user_token_and_id["token"]

    ensure_categories_exist()

    # Get preferences (should be empty initially)
    get_resp = client.get(
        "/preferences/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert isinstance(get_resp.json(), list)

    # Create a single preference
    post_resp = client.post(
        "/preferences/",
        json={"category_id": 1},
        headers=auth_header(token),
    )
    assert post_resp.status_code == 200
    assert post_resp.json()["category_id"] == 1

    # Bulk create preferences
    bulk_post_resp = client.post(
        "/preferences/bulk",
        json={"category_ids": [2, 3, 4]},
        headers=auth_header(token),
    )
    assert bulk_post_resp.status_code == 200
    assert bulk_post_resp.json()["added_count"] == 2

    # Get all preferences for the current user
    get_all_resp = client.get(
        "/preferences/",
        headers=auth_header(token),
    )
    assert get_all_resp.status_code == 200
    assert len(get_all_resp.json()) == 5  # 2 from signup + 1 + 2 from bulk

    # Delete a specific preference
    delete_resp = client.delete(
        "/preferences/1",
        headers=auth_header(token),
    )
    assert delete_resp.status_code == 200


def test_event_flow(test_user_token_and_id):
    token = test_user_token_and_id["token"]

    list_resp = client.get("/events/", headers=auth_header(token))
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)

    event_payload = {
        "title": "Test Event",
        "description": "A test event",
        "event_date": "2030-01-01T12:00:00Z",
        "max_capacity": 50,
        "street": "123 Main St",
        "city": "Test City",
        "state": "TS",
        "zip": "12345",
        "category_id": 1,
    }

    create_resp = client.post(
        "/events/",
        json=event_payload,
        headers=auth_header(token),
    )
    assert create_resp.status_code == 200
    event_id = create_resp.json().get("id")
    assert event_id is not None

    detail_resp = client.get(f"/events/{event_id}", headers=auth_header(token))
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == event_id

    update_payload = {"title": "Updated Event", "description": "Updated"}
    update_resp = client.patch(
        f"/events/{event_id}",
        json=update_payload,
        headers=auth_header(token),
    )
    assert update_resp.status_code == 200

    attendees_resp = client.get(f"/events/{event_id}/attendees")
    assert attendees_resp.status_code == 200

    delete_resp = client.delete(
        f"/events/{event_id}",
        headers=auth_header(token),
    )
    assert delete_resp.status_code == 200


def test_swipe_and_user_endpoints(test_user_token_and_id):
    token = test_user_token_and_id["token"]
    user_id = test_user_token_and_id["user_id"]

    me_resp = client.get("/users/me", headers=auth_header(token))
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["rating_score"] == 5.0

    update_resp = client.patch(
        "/users/me",
        json={"name": "Updated Name"},
        headers=auth_header(token),
    )
    assert update_resp.status_code == 200

    user_events_resp = client.get("/events/me/events", headers=auth_header(token))
    assert user_events_resp.status_code == 200
    assert user_events_resp.json() == []

    get_user_resp = client.get(f"/users/{user_id}")
    assert get_user_resp.status_code == 200
    get_user_data = get_user_resp.json()
    assert get_user_data["rating_score"] == 5.0

def test_user_ratings_routes(test_user_token_and_id):
    token = test_user_token_and_id["token"]
    user_id = test_user_token_and_id["user_id"]

    # Create another test user to rate
    other_username = f"otheruser_{uuid.uuid4().hex[:8]}"
    other_password = "Password123!"
    other_email = f"{other_username}@example.com"

    register_resp = register_user(
        username=other_username,
        password=other_password,
        email=other_email,
    )
    assert register_resp.status_code == 200
    other_user_id = register_resp.json().get("user_id")

    # Get user ratings (should be empty initially)
    get_resp = client.get(
        "/user-ratings/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert isinstance(get_resp.json(), list)
    assert len(get_resp.json()) == 0

    # Create a user rating
    post_resp = client.post(
        "/user-ratings/",
        json={"ratee_id": other_user_id, "score": 5, "comment": "Great user!"},
        headers=auth_header(token),
    )
    assert post_resp.status_code == 200
    rating_data = post_resp.json()
    assert rating_data["rater_id"] == user_id
    assert rating_data["ratee_id"] == other_user_id
    assert rating_data["score"] == 5
    assert rating_data["comment"] == "Great user!"
    rating_id = rating_data["id"]

    # Get user ratings again (should have one now)
    get_resp = client.get(
        "/user-ratings/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1

    # Get received ratings for the other user
    login_resp = client.post(
        "/auth/login",
        data={"username": other_email, "password": other_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == 200
    other_token = login_resp.json().get("access_token")

    get_received_resp = client.get(
        "/user-ratings/received",
        headers=auth_header(other_token),
    )
    assert get_received_resp.status_code == 200
    assert len(get_received_resp.json()) == 1

    # Get specific rating
    get_specific_resp = client.get(
        f"/user-ratings/{rating_id}",
        headers=auth_header(token),
    )
    assert get_specific_resp.status_code == 200

    # Update rating
    put_resp = client.put(
        f"/user-ratings/{rating_id}",
        json={"ratee_id": other_user_id, "score": 4, "comment": "Updated rating"},
        headers=auth_header(token),
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["score"] == 4
    assert put_resp.json()["comment"] == "Updated rating"

    # Delete rating
    delete_resp = client.delete(
        f"/user-ratings/{rating_id}",
        headers=auth_header(token),
    )
    assert delete_resp.status_code == 200

    # Verify rating is deleted
    get_resp = client.get(
        "/user-ratings/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 0


def test_event_ratings_routes(test_user_token_and_id):
    token = test_user_token_and_id["token"]
    user_id = test_user_token_and_id["user_id"]

    # Create a test event first
    event_resp = client.post(
        "/events/",
        json={
            "title": "Test Event for Rating",
            "description": "A test event",
            "event_date": "2026-12-31T20:00:00Z",
            "max_capacity": 10,
            "street": "456 Oak Ave",
            "city": "Test City",
            "state": "TS",
            "zip": "54321",
            "category_id": 1,
        },
        headers=auth_header(token),
    )
    assert event_resp.status_code == 200
    event_id = event_resp.json()["id"]

    # Get event ratings (should be empty initially)
    get_resp = client.get(
        "/event-ratings/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert isinstance(get_resp.json(), list)
    assert len(get_resp.json()) == 0

    # Create an event rating
    post_resp = client.post(
        "/event-ratings/",
        json={"event_id": event_id, "score": 5, "review": "Amazing event!"},
        headers=auth_header(token),
    )
    assert post_resp.status_code == 200
    rating_data = post_resp.json()
    assert rating_data["user_id"] == user_id
    assert rating_data["event_id"] == event_id
    assert rating_data["score"] == 5
    assert rating_data["review"] == "Amazing event!"
    rating_id = rating_data["id"]

    # Get event ratings again (should have one now)
    get_resp = client.get(
        "/event-ratings/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1

    # Get ratings for specific event
    get_event_ratings_resp = client.get(
        f"/event-ratings/event/{event_id}",
        headers=auth_header(token),
    )
    assert get_event_ratings_resp.status_code == 200
    assert len(get_event_ratings_resp.json()) == 1

    # Get specific rating
    get_specific_resp = client.get(
        f"/event-ratings/{rating_id}",
        headers=auth_header(token),
    )
    assert get_specific_resp.status_code == 200

    # Update rating
    put_resp = client.put(
        f"/event-ratings/{rating_id}",
        json={"event_id": event_id, "score": 4, "review": "Updated review"},
        headers=auth_header(token),
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["score"] == 4
    assert put_resp.json()["review"] == "Updated review"

    # Delete rating
    delete_resp = client.delete(
        f"/event-ratings/{rating_id}",
        headers=auth_header(token),
    )
    assert delete_resp.status_code == 200

    # Verify rating is deleted
    get_resp = client.get(
        "/event-ratings/",
        headers=auth_header(token),
    )
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 0


def test_unauthenticated_routes():
    auth_required_endpoints = [
        ("/users/me", "get"),
        ("/events/", "post"),
        ("/events/1", "patch"),
        ("/events/1", "delete"),
        ("/preferences/", "get"),
        ("/preferences/", "post"),
        ("/user-ratings/", "get"),
        ("/user-ratings/", "post"),
        ("/event-ratings/", "get"),
        ("/event-ratings/", "post"),
    ]
    for path, method in auth_required_endpoints:
        response = getattr(client, method)(path)
        assert response.status_code == 401

def test_swipe_endpoints(test_user_token_and_id):
    """Test swipe recording and retrieval"""
    token = test_user_token_and_id["token"]

    # Create a test event
    event_resp = client.post(
        "/events/",
        json={
            "title": "Swipe Test Event",
            "description": "Event for swipe testing",
            "event_date": "2026-12-31T20:00:00Z",
            "max_capacity": 20,
            "street": "123 Main St",
            "city": "Test City",
            "state": "TS",
            "zip": "12345",
            "category_id": 1,
        },
        headers=auth_header(token),
    )
    assert event_resp.status_code == 200
    event_id = event_resp.json()["id"]

    # Create another user to test swipes
    other_username = f"swipeuser_{uuid.uuid4().hex[:8]}"
    other_password = "Password123!"
    other_email = f"{other_username}@example.com"

    register_resp = register_user(
        username=other_username, password=other_password, email=other_email
    )
    assert register_resp.status_code == 200

    login_resp = client.post(
        "/auth/login",
        data={"username": other_email, "password": other_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == 200
    other_token = login_resp.json().get("access_token")

    # Test positive swipe
    swipe_resp = client.post(
        "/swipes/",
        params={"status": True, "event_id": event_id},
        headers=auth_header(other_token),
    )
    assert swipe_resp.status_code == 200
    assert swipe_resp.json()["liked"] is True
    assert swipe_resp.json()["status"] == "Swipe recorded"

    # Test getting accepted swipes
    accepted_resp = client.get(
        "/swipes/accepted",
        headers=auth_header(other_token),
    )
    assert accepted_resp.status_code == 200
    assert isinstance(accepted_resp.json(), list)
    assert len(accepted_resp.json()) == 1
    assert accepted_resp.json()[0]["id"] == event_id

    # Test negative swipe
    dislike_resp = client.post(
        "/swipes/",
        params={"status": False, "event_id": event_id},
        headers=auth_header(other_token),
    )
    assert dislike_resp.status_code == 200
    assert dislike_resp.json()["liked"] is False

    # Test organizer auto-accept
    organizer_swipe_resp = client.post(
        "/swipes/",
        params={"status": True, "event_id": event_id},
        headers=auth_header(token),
    )
    assert organizer_swipe_resp.status_code == 200
    assert organizer_swipe_resp.json()["status"] == "Organizer is automatically accepted"
    assert organizer_swipe_resp.json()["liked"] is True

    # Test swipe not found
    invalid_swipe_resp = client.post(
        "/swipes/",
        params={"status": True, "event_id": 99999},
        headers=auth_header(other_token),
    )
    assert invalid_swipe_resp.status_code == 404


def test_swipe_unauthenticated():
    """Test that swipe endpoints require authentication"""
    resp = client.post("/swipes/", params={"status": True, "event_id": 1})
    assert resp.status_code == 401

def test_notification_endpoints(test_user_token_and_id):
    """Test notification listing and marking as read"""
    token = test_user_token_and_id["token"]

    # List notifications
    list_resp = client.get(
        "/notifications/",
        headers=auth_header(token),
    )
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)
    initial_count = len(list_resp.json())

    # Get unread count
    unread_resp = client.get(
        "/notifications/unread-count",
        headers=auth_header(token),
    )
    assert unread_resp.status_code == 200
    assert isinstance(unread_resp.json(), dict)
    assert "unread_count" in unread_resp.json()
    assert unread_resp.json()["unread_count"] >= 0


def test_notification_pagination(test_user_token_and_id):
    """Test notification pagination with limit and offset"""
    token = test_user_token_and_id["token"]

    # Test with limit
    list_resp = client.get(
        "/notifications/",
        params={"limit": 10, "offset": 0},
        headers=auth_header(token),
    )
    assert list_resp.status_code == 200

    # Test invalid limit (should fail validation)
    invalid_limit_resp = client.get(
        "/notifications/",
        params={"limit": 101},
        headers=auth_header(token),
    )
    assert invalid_limit_resp.status_code == 422

    # Test negative offset (should fail validation)
    invalid_offset_resp = client.get(
        "/notifications/",
        params={"offset": -1},
        headers=auth_header(token),
    )
    assert invalid_offset_resp.status_code == 422


def test_mark_all_notifications_read(test_user_token_and_id):
    """Test marking all notifications as read"""
    token = test_user_token_and_id["token"]

    mark_all_resp = client.post(
        "/notifications/mark-all-read",
        headers=auth_header(token),
    )
    assert mark_all_resp.status_code == 200
    assert "marked_read" in mark_all_resp.json()


def test_notifications_unauthenticated():
    """Test that notification endpoints require authentication"""
    resp = client.get("/notifications/")
    assert resp.status_code == 401

def test_categories_endpoints():
    """Test category CRUD operations"""
    # Get all categories
    get_resp = client.get("/categories/")
    assert get_resp.status_code == 200
    assert isinstance(get_resp.json(), list)
    initial_count = len(get_resp.json())

    # Create a single category
    category_name = f"TestCategory_{uuid.uuid4().hex[:8]}"
    create_resp = client.post(
        "/categories/",
        json={"name": category_name},
    )
    assert create_resp.status_code == 200
    created_category = create_resp.json()
    assert created_category["name"] == category_name

    # Verify category was added
    get_resp2 = client.get("/categories/")
    assert get_resp2.status_code == 200
    assert len(get_resp2.json()) == initial_count + 1


def test_bulk_create_categories():
    """Test bulk category creation"""
    initial_resp = client.get("/categories/")
    initial_count = len(initial_resp.json())

    categories_to_create = [
        {"name": f"BulkCategory1_{uuid.uuid4().hex[:8]}"},
        {"name": f"BulkCategory2_{uuid.uuid4().hex[:8]}"},
        {"name": f"BulkCategory3_{uuid.uuid4().hex[:8]}"},
    ]

    bulk_resp = client.post(
        "/categories/bulk",
        json=categories_to_create,
    )
    assert bulk_resp.status_code == 200
    assert len(bulk_resp.json()) == 3

    # Verify all categories were added
    final_resp = client.get("/categories/")
    assert len(final_resp.json()) == initial_count + 3

def test_attendance_cron_daily_prompts():
    """Test daily attendance prompt trigger"""
    resp = client.post("/attendance/cron/daily-prompt")
    assert resp.status_code == 200
    assert "message" in resp.json()
    assert "Sent" in resp.json()["message"]


def test_attendance_confirm(test_user_token_and_id):
    """Test attendance confirmation endpoint"""
    token = test_user_token_and_id["token"]

    # Create an event
    event_resp = client.post(
        "/events/",
        json={
            "title": "Attendance Test Event",
            "description": "Event for attendance testing",
            "event_date": "2026-12-31T20:00:00Z",
            "max_capacity": 15,
            "street": "456 Oak Ave",
            "city": "Attendance City",
            "state": "AC",
            "zip": "54321",
            "category_id": 1,
        },
        headers=auth_header(token),
    )
    assert event_resp.status_code == 200
    event_id = event_resp.json()["id"]

    # Create another user and make them attend the event
    other_username = f"attenduser_{uuid.uuid4().hex[:8]}"
    other_password = "Password123!"
    other_email = f"{other_username}@example.com"

    register_resp = register_user(
        username=other_username, password=other_password, email=other_email
    )
    assert register_resp.status_code == 200

    login_resp = client.post(
        "/auth/login",
        data={"username": other_email, "password": other_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == 200
    other_token = login_resp.json().get("access_token")

    # User swipes on the event to create attendance
    swipe_resp = client.post(
        "/swipes/",
        params={"status": True, "event_id": event_id},
        headers=auth_header(other_token),
    )
    assert swipe_resp.status_code == 200

    # Confirm attendance with did_attend=True
    confirm_resp = client.post(
        f"/attendance/events/{event_id}/confirm",
        json={"did_attend": True},
        headers=auth_header(other_token),
    )
    assert confirm_resp.status_code == 200
    assert "message" in confirm_resp.json()

    # Test confirm attendance with did_attend=False
    confirm_false_resp = client.post(
        f"/attendance/events/{event_id}/confirm",
        json={"did_attend": False},
        headers=auth_header(other_token),
    )
    # Already confirmed
    assert confirm_false_resp.status_code == 200


def test_attendance_confirm_unauthenticated():
    """Test that attendance confirm requires authentication"""
    resp = client.post(
        "/attendance/events/1/confirm",
        json={"did_attend": True},
    )
    assert resp.status_code == 401

def test_auth_login_invalid_credentials():
    """Test login with invalid credentials"""
    resp = client.post(
        "/auth/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


def test_auth_register_invalid_inputs():
    """Test registration with invalid inputs"""
    ensure_categories_exist()

    # Test missing city - should get 422 (validation error) or 400
    resp = client.post(
        "/auth/register",
        data={
            "email": "test@example.com",
            "password": "Password123!",
            "full_name": "Test User",
            "age": "24",
            "bio": "Test bio",
            "city": "",
            "category_ids": json.dumps([1]),
        },
        files={
            "profile_picture": ("avatar.jpg", io.BytesIO(b"fake-image"), "image/jpeg")
        },
    )
    assert resp.status_code in [400, 422]

    # Test invalid age
    resp = client.post(
        "/auth/register",
        data={
            "email": "test@example.com",
            "password": "Password123!",
            "full_name": "Test User",
            "age": "-5",
            "bio": "Test bio",
            "city": "Test City",
            "category_ids": json.dumps([1]),
        },
        files={
            "profile_picture": ("avatar.jpg", io.BytesIO(b"fake-image"), "image/jpeg")
        },
    )
    assert resp.status_code == 400

    # Test too many categories
    resp = client.post(
        "/auth/register",
        data={
            "email": "test@example.com",
            "password": "Password123!",
            "full_name": "Test User",
            "age": "24",
            "bio": "Test bio",
            "city": "Test City",
            "category_ids": json.dumps([1, 2, 3, 4, 5, 6]),
        },
        files={
            "profile_picture": ("avatar.jpg", io.BytesIO(b"fake-image"), "image/jpeg")
        },
    )
    assert resp.status_code == 400

    # Test no categories
    resp = client.post(
        "/auth/register",
        data={
            "email": "test@example.com",
            "password": "Password123!",
            "full_name": "Test User",
            "age": "24",
            "bio": "Test bio",
            "city": "Test City",
            "category_ids": json.dumps([]),
        },
        files={
            "profile_picture": ("avatar.jpg", io.BytesIO(b"fake-image"), "image/jpeg")
        },
    )
    assert resp.status_code == 400


def test_auth_register_duplicate_email():
    """Test registration with duplicate email"""
    ensure_categories_exist()

    email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
    password = "Password123!"

    # First registration should succeed
    resp1 = register_user(username="user1", password=password, email=email)
    assert resp1.status_code == 200

    # Second registration with same email should fail
    resp2 = register_user(username="user2", password=password, email=email)
    assert resp2.status_code == 400

def test_user_profile_picture(test_user_token_and_id):
    """Test user profile picture retrieval"""
    token = test_user_token_and_id["token"]

    me_resp = client.get("/users/me", headers=auth_header(token))
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert "user_picture" in user_data


def test_user_get_non_existent():
    """Test getting a non-existent user"""
    resp = client.get("/users/99999")
    assert resp.status_code == 404


def test_user_update_profile(test_user_token_and_id):
    """Test updating user profile with various fields"""
    token = test_user_token_and_id["token"]

    # Update name
    update_resp = client.patch(
        "/users/me",
        json={"name": "Updated Name"},
        headers=auth_header(token),
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Name"

    # Update bio
    update_resp = client.patch(
        "/users/me",
        json={"bio": "New bio"},
        headers=auth_header(token),
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["bio"] == "New bio"

    # Update age
    update_resp = client.patch(
        "/users/me",
        json={"age": 30},
        headers=auth_header(token),
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["age"] == 30

def test_event_attendees_list(test_user_token_and_id):
    """Test getting attendees for an event"""
    token = test_user_token_and_id["token"]

    # Create event
    event_resp = client.post(
        "/events/",
        json={
            "title": "Attendees Test Event",
            "description": "Event for attendees testing",
            "event_date": "2026-12-31T20:00:00Z",
            "max_capacity": 25,
            "street": "789 Elm St",
            "city": "Attendees City",
            "state": "AC",
            "zip": "98765",
            "category_id": 1,
        },
        headers=auth_header(token),
    )
    assert event_resp.status_code == 200
    event_id = event_resp.json()["id"]

    # Get attendees
    attendees_resp = client.get(
        f"/events/{event_id}/attendees",
        headers=auth_header(token),
    )
    assert attendees_resp.status_code == 200
    assert isinstance(attendees_resp.json(), list)


def test_event_list_pagination(test_user_token_and_id):
    """Test event listing with pagination"""
    token = test_user_token_and_id["token"]

    resp = client.get(
        "/events/",
        params={"limit": 10, "offset": 0},
        headers=auth_header(token),
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_event_invalid_date(test_user_token_and_id):
    """Test creating event with past date"""
    token = test_user_token_and_id["token"]

    event_resp = client.post(
        "/events/",
        json={
            "title": "Past Event",
            "description": "Event in the past",
            "event_date": "2020-12-31T20:00:00Z",
            "max_capacity": 10,
            "street": "123 Main St",
            "city": "Test City",
            "state": "TS",
            "zip": "12345",
            "category_id": 1,
        },
        headers=auth_header(token),
    )

    assert event_resp.status_code in [200, 400]

def test_preference_delete_nonexistent(test_user_token_and_id):
    """Test deleting non-existent preference"""
    token = test_user_token_and_id["token"]

    resp = client.delete(
        "/preferences/99999",
        headers=auth_header(token),
    )
    assert resp.status_code == 404


def test_preference_invalid_category(test_user_token_and_id):
    """Test creating preference with invalid category"""
    token = test_user_token_and_id["token"]

    resp = client.post(
        "/preferences/",
        json={"category_id": 99999},
        headers=auth_header(token),
    )
    assert resp.status_code == 400 or resp.status_code == 404
