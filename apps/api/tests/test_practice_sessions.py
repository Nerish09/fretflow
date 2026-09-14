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


def test_complete_song_session_updates_bpm():
    song_response = client.post(
        "/songs",
        json={
            "title": "Session Progress Song",
            "artist": "Tester",
            "current_bpm": 60,
            "target_bpm": 100,
            "difficulty": "Intermediate",
            "status": "Learning",
        },
    )

    assert song_response.status_code == 201

    song_id = song_response.json()["id"]

    complete_response = client.post(
        "/practice-sessions/complete",
        json={
            "duration_minutes": 20,
            "focus": "Session Progress Song",
            "entity_type": "song",
            "entity_id": song_id,
            "bpm": 70,
            "update_progress": True,
            "notes": "Clean run at 70 BPM",
        },
    )

    assert complete_response.status_code == 201

    result = complete_response.json()

    assert result["progress_updated"] is True
    assert result["previous_bpm"] == 60
    assert result["current_bpm"] == 70

    song_response = client.get(
        f"/songs/{song_id}"
    )

    assert song_response.status_code == 200
    assert (
        song_response.json()["current_bpm"]
        == 70
    )

    history_response = client.get(
        f"/bpm-progress/song/{song_id}"
    )

    assert history_response.status_code == 200

    history = history_response.json()

    assert history[-1]["bpm"] == 70

    session_id = (
        result["session"]["id"]
    )

    client.delete(
        f"/practice-sessions/{session_id}"
    )

    client.delete(
        f"/songs/{song_id}"
    )


def test_complete_song_without_progress_update():
    song_response = client.post(
        "/songs",
        json={
            "title": "Accuracy Practice Song",
            "artist": "Tester",
            "current_bpm": 80,
            "target_bpm": 120,
            "difficulty": "Intermediate",
            "status": "Practicing",
        },
    )

    song_id = song_response.json()["id"]

    complete_response = client.post(
        "/practice-sessions/complete",
        json={
            "duration_minutes": 15,
            "focus": "Accuracy Practice Song",
            "entity_type": "song",
            "entity_id": song_id,
            "bpm": 65,
            "update_progress": False,
        },
    )

    assert complete_response.status_code == 201

    result = complete_response.json()

    assert result["progress_updated"] is False
    assert result["previous_bpm"] == 80
    assert result["current_bpm"] == 80

    song_response = client.get(
        f"/songs/{song_id}"
    )

    assert (
        song_response.json()["current_bpm"]
        == 80
    )

    session_id = (
        result["session"]["id"]
    )

    client.delete(
        f"/practice-sessions/{session_id}"
    )

    client.delete(
        f"/songs/{song_id}"
    )


def test_complete_exercise_session_updates_bpm():
    exercise_response = client.post(
        "/exercises",
        json={
            "name": "Session Progress Drill",
            "category": "Technique",
            "current_bpm": 70,
            "target_bpm": 130,
        },
    )

    assert exercise_response.status_code == 201

    exercise_id = (
        exercise_response.json()["id"]
    )

    complete_response = client.post(
        "/practice-sessions/complete",
        json={
            "duration_minutes": 10,
            "focus": "Session Progress Drill",
            "entity_type": "exercise",
            "entity_id": exercise_id,
            "bpm": 80,
            "update_progress": True,
        },
    )

    assert complete_response.status_code == 201

    result = complete_response.json()

    assert result["progress_updated"] is True
    assert result["previous_bpm"] == 70
    assert result["current_bpm"] == 80

    exercise_response = client.get(
        f"/exercises/{exercise_id}"
    )

    assert (
        exercise_response.json()["current_bpm"]
        == 80
    )

    session_id = (
        result["session"]["id"]
    )

    client.delete(
        f"/practice-sessions/{session_id}"
    )

    client.delete(
        f"/exercises/{exercise_id}"
    )
