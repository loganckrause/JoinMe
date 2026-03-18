import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add the project root to the Python path to allow for absolute imports
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))
from app.main import app

# Initialize the test client using your FastAPI app
client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


# Auth Tests
def test_register():
    # Expects 422 because the 'credentials' query parameter is missing
    response = client.post("/auth/register")
    assert response.status_code == 422


def test_login():
    response = client.post("/auth/login")
    assert response.status_code == 422


# Categories Tests
def test_get_categories():
    response = client.get("/categories/")
    assert response.status_code == 200
    assert response.json() is None


# Chat Tests
def test_get_chat_messages():
    response = client.get("/events/1/chat/")
    assert response.status_code == 200


def test_send_chat_message():
    # Expects 422 because the 'message' query parameter is missing
    response = client.post("/events/1/chat/")
    assert response.status_code == 422


# Events Tests
def test_get_event_feed():
    response = client.get("/events/")
    assert response.status_code == 200


def test_create_new_event():
    response = client.post("/events/")
    assert response.status_code == 422


def test_update_event():
    response = client.patch("/events/123")
    assert response.status_code == 200


def test_delete_event():
    response = client.delete("/events/123")
    assert response.status_code == 200


def test_get_event_attendees():
    response = client.get("/events/123/attendees")
    assert response.status_code == 200


# Swipes Tests
def test_record_user_swipe():
    # Supplying the required 'status' boolean query param
    response = client.post("/swipes/?status=true")
    assert response.status_code == 200


# Users Tests
def test_get_current_user():
    response = client.get("/users/me")
    assert response.status_code == 200


def test_update_current_user():
    response = client.patch("/users/me")
    assert response.status_code == 422


def test_get_user_events():
    response = client.get("/users/me/events")
    assert response.status_code == 200


def test_get_user():
    response = client.get("/users/123")
    assert response.status_code == 200
