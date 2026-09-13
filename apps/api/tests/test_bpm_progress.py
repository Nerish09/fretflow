from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_song_bpm_history():
    create_response = client.post(
        "/songs",
        json={
            "title": "Progress Test Song",
            "artist": "Tester",
            "current_bpm": 60,
            "target_bpm": 100,
            "difficulty": "Intermediate",
            "status": "Learning",
        },
    )

    assert create_response.status_code == 201

    song = create_response.json()

    song_id = song["id"]

    history_response = client.get(
        f"/bpm-progress/song/{song_id}"
    )

    assert history_response.status_code == 200

    history = history_response.json()

    assert len(history) == 1
    assert history[0]["bpm"] == 60

    update_response = client.patch(
        f"/songs/{song_id}",
        json={
            "current_bpm": 70,
        },
    )

    assert update_response.status_code == 200

    update_response = client.patch(
        f"/songs/{song_id}",
        json={
            "current_bpm": 80,
        },
    )

    assert update_response.status_code == 200

    history_response = client.get(
        f"/bpm-progress/song/{song_id}"
    )

    history = history_response.json()

    assert len(history) == 3

    bpms = [
        item["bpm"]
        for item in history
    ]

    assert bpms == [
        60,
        70,
        80,
    ]

    delete_response = client.delete(
        f"/songs/{song_id}"
    )

    assert delete_response.status_code == 204


def test_exercise_bpm_history():
    create_response = client.post(
        "/exercises",
        json={
            "name": "Progress Test Drill",
            "category": "Technique",
            "current_bpm": 80,
            "target_bpm": 140,
        },
    )

    assert create_response.status_code == 201

    exercise = create_response.json()

    exercise_id = exercise["id"]

    update_response = client.patch(
        f"/exercises/{exercise_id}",
        json={
            "current_bpm": 95,
        },
    )

    assert update_response.status_code == 200

    history_response = client.get(
        f"/bpm-progress/exercise/{exercise_id}"
    )

    assert history_response.status_code == 200

    history = history_response.json()

    assert len(history) == 2

    assert history[0]["bpm"] == 80
    assert history[1]["bpm"] == 95

    delete_response = client.delete(
        f"/exercises/{exercise_id}"
    )

    assert delete_response.status_code == 204


def test_invalid_bpm_progress_type():
    response = client.get(
        "/bpm-progress/invalid/1"
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "Entity type must be song or exercise"
    )
