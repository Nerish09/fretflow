from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_practice_queue():
    song_response = client.post(
        "/songs",
        json={
            "title": "Queue Test Song",
            "artist": "Test Artist",
            "current_bpm": 50,
            "target_bpm": 100,
            "difficulty": "Intermediate",
            "status": "Learning",
        },
    )

    assert song_response.status_code == 201

    song_id = song_response.json()["id"]

    exercise_response = client.post(
        "/exercises",
        json={
            "name": "Queue Test Drill",
            "category": "Technique",
            "current_bpm": 60,
            "target_bpm": 120,
        },
    )

    assert exercise_response.status_code == 201

    exercise_id = (
        exercise_response.json()["id"]
    )

    response = client.get(
        "/practice-queue?minutes=30"
    )

    assert response.status_code == 200

    data = response.json()

    assert (
        data["requested_minutes"]
        == 30
    )

    assert (
        data["planned_minutes"]
        == 30
    )

    assert isinstance(
        data["items"],
        list,
    )

    assert len(data["items"]) > 0

    assert (
        data["items"][0]["type"]
        == "warmup"
    )

    names = [
        item["name"]
        for item in data["items"]
    ]

    assert "Queue Test Song" in names
    assert "Queue Test Drill" in names

    total_minutes = sum(
        item["suggested_minutes"]
        for item in data["items"]
    )

    assert total_minutes == 30

    client.delete(
        f"/songs/{song_id}"
    )

    client.delete(
        f"/exercises/{exercise_id}"
    )


def test_practice_queue_invalid_minutes():
    response = client.get(
        "/practice-queue?minutes=5"
    )

    assert response.status_code == 422


def test_practice_queue_60_minutes_fills_time():
    song_response = client.post(
        "/songs",
        json={
            "title": "Long Queue Song",
            "artist": "Test Artist",
            "current_bpm": 70,
            "target_bpm": 120,
            "difficulty": "Advanced",
            "status": "Practicing",
        },
    )

    assert song_response.status_code == 201

    song_id = song_response.json()["id"]

    response = client.get(
        "/practice-queue?minutes=60"
    )

    assert response.status_code == 200

    data = response.json()

    assert (
        data["planned_minutes"]
        == 60
    )

    assert sum(
        item["suggested_minutes"]
        for item in data["items"]
    ) == 60

    client.delete(
        f"/songs/{song_id}"
    )
