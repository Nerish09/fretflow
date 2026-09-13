from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.bpm_progress import BpmProgress
from app.models.exercise import Exercise
from app.models.song import Song


router = APIRouter(
    prefix="/bpm-progress",
    tags=["BPM Progress"],
)


def serialize_progress(
    progress: BpmProgress,
):
    return {
        "id": progress.id,
        "entity_type": progress.entity_type,
        "entity_id": progress.entity_id,
        "bpm": progress.bpm,
        "recorded_at": progress.recorded_at,
    }


@router.get("/{entity_type}/{entity_id}")
def get_bpm_progress(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
):
    if entity_type not in {
        "song",
        "exercise",
    }:
        raise HTTPException(
            status_code=400,
            detail="Entity type must be song or exercise",
        )

    if entity_type == "song":
        entity = db.get(
            Song,
            entity_id,
        )

        if entity is None:
            raise HTTPException(
                status_code=404,
                detail="Song not found",
            )

    if entity_type == "exercise":
        entity = db.get(
            Exercise,
            entity_id,
        )

        if entity is None:
            raise HTTPException(
                status_code=404,
                detail="Exercise not found",
            )

    statement = (
        select(BpmProgress)
        .where(
            BpmProgress.entity_type
            == entity_type,
            BpmProgress.entity_id
            == entity_id,
        )
        .order_by(
            BpmProgress.recorded_at.asc()
        )
    )

    history = db.scalars(
        statement
    ).all()

    return [
        serialize_progress(item)
        for item in history
    ]
