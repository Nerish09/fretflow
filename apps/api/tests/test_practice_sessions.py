from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_practice_session_crud():
    create_response = client.post(
        "/practice-sessions",
        json={
            "duration_minutes": 45,
            "focus": "Pentatonic Scale",
            "notes": "Worked on clean transitions",
        },
    )

    assert create_response.status_code == 201

    session = create_response.json()

    session_id = session["id"]

    assert session["duration_minutes"] == 45
    assert session["focus"] == "Pentatonic Scale"

    update_response = client.patch(
        f"/practice-sessions/{session_id}",
        json={
            "duration_minutes": 60,
            "notes": "Great session",
        },
    )

    assert update_response.status_code == 200

    updated = update_response.json()

    assert updated["duration_minutes"] == 60
    assert updated["notes"] == "Great session"

    delete_response = client.delete(
        f"/practice-sessions/{session_id}"
    )

    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/practice-sessions/{session_id}"
    )

    assert missing_response.status_code == 404


def test_invalid_practice_duration():
    response = client.post(
        "/practice-sessions",
        json={
            "duration_minutes": 0,
            "focus": "Scales",
        },
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "Duration must be greater than 0"
    )


def test_missing_practice_focus():
    response = client.post(
        "/practice-sessions",
        json={
            "duration_minutes": 30,
            "focus": "   ",
        },
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "Practice focus is required"
    )
