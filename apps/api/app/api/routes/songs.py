from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.bpm_progress import BpmProgress
from app.models.song import Song


router = APIRouter(
    prefix="/songs",
    tags=["Songs"],
)


ALLOWED_DIFFICULTIES = {
    "Beginner",
    "Intermediate",
    "Advanced",
}

ALLOWED_STATUSES = {
    "Learning",
    "Practicing",
    "Mastered",
}


class SongCreate(BaseModel):
    title: str
    artist: str
    current_bpm: int = 60
    target_bpm: int = 100
    difficulty: str = "Intermediate"
    status: str = "Learning"
    notes: str | None = None


class SongUpdate(BaseModel):
    title: str | None = None
    artist: str | None = None
    current_bpm: int | None = None
    target_bpm: int | None = None
    difficulty: str | None = None
    status: str | None = None
    notes: str | None = None


def validate_bpm(value: int):
    if value < 20 or value > 300:
        raise HTTPException(
            status_code=400,
            detail="BPM must be between 20 and 300",
        )


def serialize_song(song: Song):
    return {
        "id": song.id,
        "title": song.title,
        "artist": song.artist,
        "current_bpm": song.current_bpm,
        "target_bpm": song.target_bpm,
        "difficulty": song.difficulty,
        "status": song.status,
        "notes": song.notes,
        "created_at": song.created_at,
    }


def record_bpm(
    db: Session,
    song_id: int,
    bpm: int,
):
    db.add(
        BpmProgress(
            entity_type="song",
            entity_id=song_id,
            bpm=bpm,
        )
    )


@router.get("")
def get_songs(
    db: Session = Depends(get_db),
):
    statement = select(Song).order_by(
        Song.created_at.desc()
    )

    songs = db.scalars(statement).all()

    return [
        serialize_song(song)
        for song in songs
    ]


@router.get("/{song_id}")
def get_song(
    song_id: int,
    db: Session = Depends(get_db),
):
    song = db.get(
        Song,
        song_id,
    )

    if song is None:
        raise HTTPException(
            status_code=404,
            detail="Song not found",
        )

    return serialize_song(song)


@router.post(
    "",
    status_code=201,
)
def create_song(
    data: SongCreate,
    db: Session = Depends(get_db),
):
    title = data.title.strip()
    artist = data.artist.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Song title is required",
        )

    if not artist:
        raise HTTPException(
            status_code=400,
            detail="Artist is required",
        )

    validate_bpm(
        data.current_bpm
    )

    validate_bpm(
        data.target_bpm
    )

    if (
        data.difficulty
        not in ALLOWED_DIFFICULTIES
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty",
        )

    if (
        data.status
        not in ALLOWED_STATUSES
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid song status",
        )

    song = Song(
        title=title,
        artist=artist,
        current_bpm=data.current_bpm,
        target_bpm=data.target_bpm,
        difficulty=data.difficulty,
        status=data.status,
        notes=data.notes,
    )

    db.add(song)
    db.flush()

    record_bpm(
        db,
        song.id,
        song.current_bpm,
    )

    db.commit()
    db.refresh(song)

    return serialize_song(song)


@router.patch("/{song_id}")
def update_song(
    song_id: int,
    data: SongUpdate,
    db: Session = Depends(get_db),
):
    song = db.get(
        Song,
        song_id,
    )

    if song is None:
        raise HTTPException(
            status_code=404,
            detail="Song not found",
        )

    if data.title is not None:
        title = data.title.strip()

        if not title:
            raise HTTPException(
                status_code=400,
                detail="Song title is required",
            )

        song.title = title

    if data.artist is not None:
        artist = data.artist.strip()

        if not artist:
            raise HTTPException(
                status_code=400,
                detail="Artist is required",
            )

        song.artist = artist

    if data.current_bpm is not None:
        validate_bpm(
            data.current_bpm
        )

        if (
            data.current_bpm
            != song.current_bpm
        ):
            song.current_bpm = (
                data.current_bpm
            )

            record_bpm(
                db,
                song.id,
                data.current_bpm,
            )

    if data.target_bpm is not None:
        validate_bpm(
            data.target_bpm
        )

        song.target_bpm = (
            data.target_bpm
        )

    if data.difficulty is not None:
        if (
            data.difficulty
            not in ALLOWED_DIFFICULTIES
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid difficulty",
            )

        song.difficulty = (
            data.difficulty
        )

    if data.status is not None:
        if (
            data.status
            not in ALLOWED_STATUSES
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid song status",
            )

        song.status = (
            data.status
        )

    if data.notes is not None:
        song.notes = data.notes

    db.commit()
    db.refresh(song)

    return serialize_song(song)


@router.delete(
    "/{song_id}",
    status_code=204,
)
def delete_song(
    song_id: int,
    db: Session = Depends(get_db),
):
    song = db.get(
        Song,
        song_id,
    )

    if song is None:
        raise HTTPException(
            status_code=404,
            detail="Song not found",
        )

    history = db.scalars(
        select(BpmProgress).where(
            BpmProgress.entity_type
            == "song",
            BpmProgress.entity_id
            == song_id,
        )
    ).all()

    for item in history:
        db.delete(item)

    db.delete(song)
    db.commit()

    return Response(
        status_code=204
    )
