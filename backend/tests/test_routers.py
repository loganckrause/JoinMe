import sys
import uuid
import io
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add the project root to the Python path to allow for absolute imports
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

# Override database URL for testing BEFORE any app imports
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_joinme.db"

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

    list_resp = client.get("/events/")
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)

    event_payload = {
        "title": "Test Event",
        "description": "A test event",
        "event_date": "2030-01-01T12:00:00Z",
        "max_capacity": 50,
        "location": "Test Location",
        "latitude": 1.0,
        "longitude": 1.0,
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

    swipe_resp = client.post("/swipes/?status=true")
    assert swipe_resp.status_code == 200

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
            "location": "Test Location",
            "latitude": 40.7128,
            "longitude": -74.0060,
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
