import sys
import uuid
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add the project root to the Python path to allow for absolute imports
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))
from app.main import app
from app.core.database import create_db_and_tables

# Ensure DB schema exists before tests run
create_db_and_tables()

# Initialize the test client using your FastAPI app
client = TestClient(app)


@pytest.fixture(scope="session")
def test_user_token_and_id():
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "Password123!"
    email = f"{username}@example.com"

    register_resp = client.post(
        "/auth/register",
        json={"username": username, "password": password, "email": email},
    )
    assert register_resp.status_code == 200
    user_id = register_resp.json().get("user_id")
    assert user_id is not None

    login_resp = client.post(
        "/auth/login",
        data={"username": username, "password": password},
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

    update_resp = client.patch(
        "/users/me",
        json={"name": "Updated Name"},
        headers=auth_header(token),
    )
    assert update_resp.status_code == 200

    user_events_resp = client.get("/users/me/events", headers=auth_header(token))
    assert user_events_resp.status_code == 200
    assert user_events_resp.json() == []

    get_user_resp = client.get(f"/users/{user_id}")
    assert get_user_resp.status_code == 200


def test_unauthenticated_routes():
    auth_required_endpoints = [
        ("/users/me", "get"),
        ("/events/", "post"),
        ("/events/1", "patch"),
        ("/events/1", "delete"),
    ]
    for path, method in auth_required_endpoints:
        response = getattr(client, method)(path)
        assert response.status_code == 401

