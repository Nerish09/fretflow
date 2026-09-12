from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.practice_session import PracticeSession


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

    sessions = db.scalars(statement).all()

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

    return serialize_session(session)


@router.post(
    "",
    status_code=201,
)
def create_practice_session(
    data: PracticeSessionCreate,
    db: Session = Depends(get_db),
):
    if data.duration_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="Duration must be greater than 0",
        )

    focus = data.focus.strip()

    if not focus:
        raise HTTPException(
            status_code=400,
            detail="Practice focus is required",
        )

    session = PracticeSession(
        duration_minutes=data.duration_minutes,
        focus=focus,
        notes=data.notes,
    )

    if data.started_at is not None:
        session.started_at = data.started_at

    db.add(session)
    db.commit()
    db.refresh(session)

    return serialize_session(session)


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
        if data.duration_minutes <= 0:
            raise HTTPException(
                status_code=400,
                detail="Duration must be greater than 0",
            )

        session.duration_minutes = (
            data.duration_minutes
        )

    if data.focus is not None:
        focus = data.focus.strip()

        if not focus:
            raise HTTPException(
                status_code=400,
                detail="Practice focus is required",
            )

        session.focus = focus

    if data.notes is not None:
        session.notes = data.notes

    if data.started_at is not None:
        session.started_at = data.started_at

    db.commit()
    db.refresh(session)

    return serialize_session(session)


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

    return Response(status_code=204)
