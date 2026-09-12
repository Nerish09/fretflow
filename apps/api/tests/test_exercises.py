from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_exercise_crud():
    create_response = client.post(
        "/exercises",
        json={
            "name": "Alternate Picking",
            "category": "Technique",
            "current_bpm": 80,
            "target_bpm": 140,
            "notes": "Keep wrist relaxed",
        },
    )

    assert create_response.status_code == 201

    exercise = create_response.json()

    exercise_id = exercise["id"]

    assert exercise["name"] == "Alternate Picking"
    assert exercise["category"] == "Technique"

    update_response = client.patch(
        f"/exercises/{exercise_id}",
        json={
            "current_bpm": 95,
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["current_bpm"] == 95

    delete_response = client.delete(
        f"/exercises/{exercise_id}"
    )

    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/exercises/{exercise_id}"
    )

    assert missing_response.status_code == 404


def test_invalid_exercise_bpm():
    response = client.post(
        "/exercises",
        json={
            "name": "Speed Test",
            "category": "Technique",
            "current_bpm": 500,
            "target_bpm": 120,
        },
    )

    assert response.status_code == 400
