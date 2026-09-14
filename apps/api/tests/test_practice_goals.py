from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def create_session(
    minutes: int,
    days_ago: int,
    focus: str,
):
    started_at = (
        datetime.now(
            timezone.utc
        )
        - timedelta(
            days=days_ago
        )
    )

    response = client.post(
        "/practice-sessions",
        json={
            "duration_minutes": minutes,
            "focus": focus,
            "started_at": started_at.isoformat(),
        },
    )

    assert (
        response.status_code
        == 201
    )

    return response.json()


def delete_session(
    session_id: int,
):
    response = client.delete(
        f"/practice-sessions/{session_id}"
    )

    assert (
        response.status_code
        == 204
    )


def test_practice_goals_default_response():
    response = client.get(
        "/practice-goals"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["daily"]["goal_minutes"]
        == 30
    )

    assert (
        data["weekly"]["goal_minutes"]
        == 180
    )

    assert (
        "current"
        in data["streaks"]
    )

    assert (
        "longest"
        in data["streaks"]
    )


def test_daily_goal_progress():
    session = create_session(
        minutes=20,
        days_ago=0,
        focus="Daily Goal Test",
    )

    response = client.get(
        "/practice-goals"
        "?daily_goal=30"
        "&weekly_goal=180"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["daily"]["completed_minutes"]
        >= 20
    )

    assert (
        data["daily"]["progress_percent"]
        >= 67
    )

    delete_session(
        session["id"]
    )


def test_daily_goal_completion():
    session = create_session(
        minutes=35,
        days_ago=0,
        focus="Goal Completion Test",
    )

    response = client.get(
        "/practice-goals"
        "?daily_goal=30"
    )

    data = response.json()

    assert (
        data["daily"]["completed"]
        is True
    )

    assert (
        data["daily"]["remaining_minutes"]
        == 0
    )

    assert (
        data["daily"]["progress_percent"]
        == 100
    )

    delete_session(
        session["id"]
    )


def test_weekly_goal_counts_last_seven_days():
    recent_session = create_session(
        minutes=40,
        days_ago=2,
        focus="Recent Weekly Test",
    )

    old_session = create_session(
        minutes=90,
        days_ago=8,
        focus="Old Weekly Test",
    )

    response = client.get(
        "/practice-goals"
        "?weekly_goal=180"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["weekly"]["completed_minutes"]
        >= 40
    )

    delete_session(
        recent_session["id"]
    )

    delete_session(
        old_session["id"]
    )


def test_streak_calculation():
    created_sessions = []

    for days_ago in [
        0,
        1,
        2,
    ]:
        created_sessions.append(
            create_session(
                minutes=10,
                days_ago=days_ago,
                focus=f"Streak Test {days_ago}",
            )
        )

    response = client.get(
        "/practice-goals"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["streaks"]["current"]
        >= 3
    )

    assert (
        data["streaks"]["longest"]
        >= 3
    )

    for session in created_sessions:
        delete_session(
            session["id"]
        )


def test_custom_goal_values():
    response = client.get(
        "/practice-goals"
        "?daily_goal=45"
        "&weekly_goal=240"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["daily"]["goal_minutes"]
        == 45
    )

    assert (
        data["weekly"]["goal_minutes"]
        == 240
    )


def test_invalid_goal_values():
    response = client.get(
        "/practice-goals"
        "?daily_goal=0"
    )

    assert (
        response.status_code
        == 422
    )
