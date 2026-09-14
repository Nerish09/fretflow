from types import SimpleNamespace

from app.services.practice_planner import build_practice_plan


def make_song(
    song_id: int,
    title: str,
    current_bpm: int,
    target_bpm: int,
):
    return SimpleNamespace(
        id=song_id,
        title=title,
        current_bpm=current_bpm,
        target_bpm=target_bpm,
    )


def make_exercise(
    exercise_id: int,
    name: str,
):
    return SimpleNamespace(
        id=exercise_id,
        name=name,
    )


def test_plan_fills_requested_time():
    songs = [
        make_song(
            1,
            "Hotel California",
            75,
            100,
        ),
    ]

    exercises = [
        make_exercise(
            1,
            "Alternate Picking",
        ),
    ]

    plan = build_practice_plan(
        requested_minutes=30,
        songs=songs,
        exercises=exercises,
    )

    total_minutes = sum(
        item["duration_minutes"]
        for item in plan
    )

    assert total_minutes == 30


def test_plan_starts_with_warmup():
    songs = [
        make_song(
            1,
            "Song A",
            60,
            100,
        ),
    ]

    plan = build_practice_plan(
        requested_minutes=20,
        songs=songs,
        exercises=[],
    )

    assert plan[0]["type"] == "warmup"
    assert plan[0]["duration_minutes"] == 5


def test_plan_prioritizes_largest_bpm_gap():
    songs = [
        make_song(
            1,
            "Closer Song",
            90,
            100,
        ),
        make_song(
            2,
            "Weakest Song",
            50,
            100,
        ),
    ]

    plan = build_practice_plan(
        requested_minutes=20,
        songs=songs,
        exercises=[],
    )

    song_items = [
        item
        for item in plan
        if item["type"] == "song"
    ]

    assert song_items[0]["title"] == "Weakest Song"


def test_plan_uses_exercises():
    songs = []

    exercises = [
        make_exercise(
            1,
            "Spider Exercise",
        ),
    ]

    plan = build_practice_plan(
        requested_minutes=10,
        songs=songs,
        exercises=exercises,
    )

    exercise_items = [
        item
        for item in plan
        if item["type"] == "exercise"
    ]

    assert len(exercise_items) == 1
    assert exercise_items[0]["title"] == "Spider Exercise"


def test_plan_handles_no_content():
    plan = build_practice_plan(
        requested_minutes=30,
        songs=[],
        exercises=[],
    )

    total_minutes = sum(
        item["duration_minutes"]
        for item in plan
    )

    assert total_minutes == 5
    assert plan[0]["type"] == "warmup"


def test_plan_handles_zero_minutes():
    plan = build_practice_plan(
        requested_minutes=0,
        songs=[],
        exercises=[],
    )

    assert plan == []
