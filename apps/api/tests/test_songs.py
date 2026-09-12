from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_song_crud():
    create_response = client.post(
        "/songs",
        json={
            "title": "Test Song",
            "artist": "Test Artist",
            "current_bpm": 70,
            "target_bpm": 100,
            "difficulty": "Intermediate",
            "status": "Learning",
            "notes": "Testing song CRUD",
        },
    )

    assert create_response.status_code == 201

    song = create_response.json()

    song_id = song["id"]

    assert song["title"] == "Test Song"
    assert song["artist"] == "Test Artist"
    assert song["current_bpm"] == 70
    assert song["target_bpm"] == 100

    get_response = client.get(
        f"/songs/{song_id}"
    )

    assert get_response.status_code == 200

    update_response = client.patch(
        f"/songs/{song_id}",
        json={
            "current_bpm": 85,
            "status": "Practicing",
        },
    )

    assert update_response.status_code == 200

    updated_song = update_response.json()

    assert updated_song["current_bpm"] == 85
    assert updated_song["status"] == "Practicing"

    delete_response = client.delete(
        f"/songs/{song_id}"
    )

    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/songs/{song_id}"
    )

    assert missing_response.status_code == 404


def test_invalid_song_bpm():
    response = client.post(
        "/songs",
        json={
            "title": "Invalid BPM",
            "artist": "Tester",
            "current_bpm": 5,
            "target_bpm": 100,
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "BPM must be between 20 and 300"
    )


def test_invalid_song_difficulty():
    response = client.post(
        "/songs",
        json={
            "title": "Difficulty Test",
            "artist": "Tester",
            "current_bpm": 60,
            "target_bpm": 100,
            "difficulty": "Impossible",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid difficulty"
