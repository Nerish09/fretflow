from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.bpm_progress import BpmProgress
from app.models.exercise import Exercise
from app.models.practice_session import PracticeSession
from app.models.song import Song


router = APIRouter(
    prefix="/practice-sessions",
    tags=["Practice Sessions"],
)


class PracticeSessionCreate(BaseModel):
    duration_minutes: int
    focus: str
    notes: str | None = None
    started_at: datetime | None = None


class PracticeSessionUpdate(BaseModel):
    duration_minutes: int | None = None
    focus: str | None = None
    notes: str | None = None
    started_at: datetime | None = None


class PracticeSessionComplete(BaseModel):
    duration_minutes: int
    focus: str
    notes: str | None = None
    started_at: datetime | None = None

    entity_type: str = "custom"
    entity_id: int | None = None

    bpm: int | None = None
    update_progress: bool = True


def serialize_session(
    session: PracticeSession,
):
    return {
        "id": session.id,
        "started_at": session.started_at,
        "duration_minutes": session.duration_minutes,
        "focus": session.focus,
        "notes": session.notes,
        "created_at": session.created_at,
    }


def validate_duration(
    duration_minutes: int,
):
    if duration_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="Duration must be greater than 0",
        )


def validate_focus(
    focus: str,
):
    cleaned = focus.strip()

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="Practice focus is required",
        )

    return cleaned


def validate_bpm(
    bpm: int,
):
    if bpm < 20 or bpm > 300:
        raise HTTPException(
            status_code=400,
            detail="BPM must be between 20 and 300",
        )


@router.get("")
def get_practice_sessions(
    db: Session = Depends(get_db),
):
    statement = (
        select(PracticeSession)
        .order_by(
            PracticeSession.started_at.desc()
        )
    )

    sessions = db.scalars(
        statement
    ).all()

    return [
        serialize_session(session)
        for session in sessions
    ]


@router.get("/{session_id}")
def get_practice_session(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.get(
        PracticeSession,
        session_id,
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Practice session not found",
        )

    return serialize_session(
        session
    )


@router.post(
    "",
    status_code=201,
)
def create_practice_session(
    data: PracticeSessionCreate,
    db: Session = Depends(get_db),
):
    validate_duration(
        data.duration_minutes
    )

    focus = validate_focus(
        data.focus
    )

    session = PracticeSession(
        duration_minutes=data.duration_minutes,
        focus=focus,
        notes=data.notes,
    )

    if data.started_at is not None:
        session.started_at = (
            data.started_at
        )

    db.add(session)
    db.commit()
    db.refresh(session)

    return serialize_session(
        session
    )


@router.post(
    "/complete",
    status_code=201,
)
def complete_practice_session(
    data: PracticeSessionComplete,
    db: Session = Depends(get_db),
):
    validate_duration(
        data.duration_minutes
    )

    focus = validate_focus(
        data.focus
    )

    if data.entity_type not in {
        "song",
        "exercise",
        "custom",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Entity type must be "
                "song, exercise, or custom"
            ),
        )

    if data.bpm is not None:
        validate_bpm(
            data.bpm
        )

    previous_bpm = None
    new_bpm = None
    progress_updated = False

    if data.entity_type == "song":
        if data.entity_id is None:
            raise HTTPException(
                status_code=400,
                detail="Song ID is required",
            )

        song = db.get(
            Song,
            data.entity_id,
        )

        if song is None:
            raise HTTPException(
                status_code=404,
                detail="Song not found",
            )

        previous_bpm = (
            song.current_bpm
        )

        if (
            data.update_progress
            and data.bpm is not None
            and data.bpm
            != song.current_bpm
        ):
            song.current_bpm = (
                data.bpm
            )

            db.add(
                BpmProgress(
                    entity_type="song",
                    entity_id=song.id,
                    bpm=data.bpm,
                )
            )

            progress_updated = True

        new_bpm = (
            song.current_bpm
        )

    elif data.entity_type == "exercise":
        if data.entity_id is None:
            raise HTTPException(
                status_code=400,
                detail="Exercise ID is required",
            )

        exercise = db.get(
            Exercise,
            data.entity_id,
        )

        if exercise is None:
            raise HTTPException(
                status_code=404,
                detail="Exercise not found",
            )

        previous_bpm = (
            exercise.current_bpm
        )

        if (
            data.update_progress
            and data.bpm is not None
            and data.bpm
            != exercise.current_bpm
        ):
            exercise.current_bpm = (
                data.bpm
            )

            db.add(
                BpmProgress(
                    entity_type="exercise",
                    entity_id=exercise.id,
                    bpm=data.bpm,
                )
            )

            progress_updated = True

        new_bpm = (
            exercise.current_bpm
        )

    session = PracticeSession(
        duration_minutes=data.duration_minutes,
        focus=focus,
        notes=data.notes,
    )

    if data.started_at is not None:
        session.started_at = (
            data.started_at
        )

    db.add(session)

    db.commit()
    db.refresh(session)

    return {
        "session": serialize_session(
            session
        ),
        "progress_updated": progress_updated,
        "previous_bpm": previous_bpm,
        "current_bpm": new_bpm,
    }


@router.patch("/{session_id}")
def update_practice_session(
    session_id: int,
    data: PracticeSessionUpdate,
    db: Session = Depends(get_db),
):
    session = db.get(
        PracticeSession,
        session_id,
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Practice session not found",
        )

    if data.duration_minutes is not None:
        validate_duration(
            data.duration_minutes
        )

        session.duration_minutes = (
            data.duration_minutes
        )

    if data.focus is not None:
        session.focus = (
            validate_focus(
                data.focus
            )
        )

    if data.notes is not None:
        session.notes = (
            data.notes
        )

    if data.started_at is not None:
        session.started_at = (
            data.started_at
        )

    db.commit()
    db.refresh(session)

    return serialize_session(
        session
    )


@router.delete(
    "/{session_id}",
    status_code=204,
)
def delete_practice_session(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.get(
        PracticeSession,
        session_id,
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Practice session not found",
        )

    db.delete(session)
    db.commit()

    return Response(
        status_code=204
    )
