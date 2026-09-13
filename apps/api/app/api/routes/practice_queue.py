from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercise import Exercise
from app.models.song import Song


router = APIRouter(
    prefix="/practice-queue",
    tags=["Practice Queue"],
)


def calculate_progress(
    current_bpm: int,
    target_bpm: int,
) -> int:
    if target_bpm <= 0:
        return 0

    return min(
        100,
        round(
            (current_bpm / target_bpm) * 100
        ),
    )


def song_item(song: Song) -> dict:
    return {
        "type": "song",
        "id": song.id,
        "name": song.title,
        "subtitle": song.artist,
        "current_bpm": song.current_bpm,
        "target_bpm": song.target_bpm,
        "progress": calculate_progress(
            song.current_bpm,
            song.target_bpm,
        ),
        "suggested_minutes": 12,
    }


def exercise_item(exercise: Exercise) -> dict:
    category = exercise.category

    suggested_minutes = (
        5
        if category.lower() == "warm-up"
        else 7
    )

    return {
        "type": "exercise",
        "id": exercise.id,
        "name": exercise.name,
        "subtitle": category,
        "current_bpm": exercise.current_bpm,
        "target_bpm": exercise.target_bpm,
        "progress": calculate_progress(
            exercise.current_bpm,
            exercise.target_bpm,
        ),
        "suggested_minutes": suggested_minutes,
    }


@router.get("")
def get_practice_queue(
    minutes: int = Query(
        default=30,
        ge=10,
        le=120,
    ),
    db: Session = Depends(get_db),
):
    songs = db.scalars(
        select(Song).where(
            Song.status != "Mastered"
        )
    ).all()

    exercises = db.scalars(
        select(Exercise)
    ).all()

    song_items = [
        song_item(song)
        for song in songs
    ]

    exercise_items = [
        exercise_item(exercise)
        for exercise in exercises
    ]

    song_items.sort(
        key=lambda item: item["progress"]
    )

    exercise_items.sort(
        key=lambda item: item["progress"]
    )

    warmups = [
        item
        for item in exercise_items
        if item["subtitle"].lower() == "warm-up"
    ]

    non_warmup_exercises = [
        item
        for item in exercise_items
        if item["subtitle"].lower() != "warm-up"
    ]

    ordered_candidates = []

    # Start with one warm-up if available.
    if warmups:
        ordered_candidates.append(
            warmups[0]
        )

    # Then prioritize the weakest song.
    if song_items:
        ordered_candidates.append(
            song_items[0]
        )

    # Then the weakest technique drill.
    if non_warmup_exercises:
        ordered_candidates.append(
            non_warmup_exercises[0]
        )

    used_keys = {
        (item["type"], item["id"])
        for item in ordered_candidates
    }

    remaining_candidates = [
        *song_items,
        *exercise_items,
    ]

    remaining_candidates = [
        item
        for item in remaining_candidates
        if (
            item["type"],
            item["id"],
        )
        not in used_keys
    ]

    remaining_candidates.sort(
        key=lambda item: item["progress"]
    )

    ordered_candidates.extend(
        remaining_candidates
    )

    queue = []
    planned_minutes = 0

    for item in ordered_candidates:
        remaining = (
            minutes - planned_minutes
        )

        if remaining < 3:
            break

        item_minutes = min(
            item["suggested_minutes"],
            remaining,
        )

        queue.append(
            {
                **item,
                "suggested_minutes": item_minutes,
            }
        )

        planned_minutes += item_minutes

        if planned_minutes >= minutes:
            break

    return {
        "requested_minutes": minutes,
        "planned_minutes": planned_minutes,
        "items": queue,
    }
