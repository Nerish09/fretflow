from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercise import Exercise
from app.models.song import Song
from app.services.practice_planner import build_practice_plan


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
            (current_bpm / target_bpm)
            * 100
        ),
    )


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

    plan = build_practice_plan(
        requested_minutes=minutes,
        songs=songs,
        exercises=exercises,
    )

    items = []

    for item in plan:
        if item["type"] == "warmup":
            items.append({
                "type": "warmup",
                "id": None,
                "name": item["title"],
                "subtitle": "Preparation",
                "current_bpm": None,
                "target_bpm": None,
                "progress": 0,
                "suggested_minutes": item[
                    "duration_minutes"
                ],
            })

        elif item["type"] == "song":
            song = next(
                (
                    song
                    for song in songs
                    if song.id
                    == item["id"]
                ),
                None,
            )

            if song is None:
                continue

            items.append({
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
                "suggested_minutes": item[
                    "duration_minutes"
                ],
            })

        elif item["type"] == "exercise":
            exercise = next(
                (
                    exercise
                    for exercise
                    in exercises
                    if exercise.id
                    == item["id"]
                ),
                None,
            )

            if exercise is None:
                continue

            items.append({
                "type": "exercise",
                "id": exercise.id,
                "name": exercise.name,
                "subtitle": exercise.category,
                "current_bpm": exercise.current_bpm,
                "target_bpm": exercise.target_bpm,
                "progress": calculate_progress(
                    exercise.current_bpm,
                    exercise.target_bpm,
                ),
                "suggested_minutes": item[
                    "duration_minutes"
                ],
            })

    planned_minutes = sum(
        item["suggested_minutes"]
        for item in items
    )

    return {
        "requested_minutes": minutes,
        "planned_minutes": planned_minutes,
        "items": items,
    }
