from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exercise import Exercise


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"],
)


class ExerciseCreate(BaseModel):
    name: str
    category: str
    current_bpm: int = 60
    target_bpm: int = 100
    notes: str | None = None


class ExerciseUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    current_bpm: int | None = None
    target_bpm: int | None = None
    notes: str | None = None


def validate_bpm(value: int):
    if value < 20 or value > 300:
        raise HTTPException(
            status_code=400,
            detail="BPM must be between 20 and 300",
        )


def serialize_exercise(exercise: Exercise):
    return {
        "id": exercise.id,
        "name": exercise.name,
        "category": exercise.category,
        "current_bpm": exercise.current_bpm,
        "target_bpm": exercise.target_bpm,
        "notes": exercise.notes,
        "created_at": exercise.created_at,
    }


@router.get("")
def get_exercises(
    db: Session = Depends(get_db),
):
    statement = select(Exercise).order_by(
        Exercise.created_at.desc()
    )

    exercises = db.scalars(statement).all()

    return [
        serialize_exercise(exercise)
        for exercise in exercises
    ]


@router.get("/{exercise_id}")
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
):
    exercise = db.get(
        Exercise,
        exercise_id,
    )

    if exercise is None:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    return serialize_exercise(exercise)


@router.post(
    "",
    status_code=201,
)
def create_exercise(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    category = data.category.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Exercise name is required",
        )

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Exercise category is required",
        )

    validate_bpm(data.current_bpm)
    validate_bpm(data.target_bpm)

    exercise = Exercise(
        name=name,
        category=category,
        current_bpm=data.current_bpm,
        target_bpm=data.target_bpm,
        notes=data.notes,
    )

    db.add(exercise)
    db.commit()
    db.refresh(exercise)

    return serialize_exercise(exercise)


@router.patch("/{exercise_id}")
def update_exercise(
    exercise_id: int,
    data: ExerciseUpdate,
    db: Session = Depends(get_db),
):
    exercise = db.get(
        Exercise,
        exercise_id,
    )

    if exercise is None:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    if data.name is not None:
        name = data.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Exercise name is required",
            )

        exercise.name = name

    if data.category is not None:
        category = data.category.strip()

        if not category:
            raise HTTPException(
                status_code=400,
                detail="Exercise category is required",
            )

        exercise.category = category

    if data.current_bpm is not None:
        validate_bpm(data.current_bpm)
        exercise.current_bpm = data.current_bpm

    if data.target_bpm is not None:
        validate_bpm(data.target_bpm)
        exercise.target_bpm = data.target_bpm

    if data.notes is not None:
        exercise.notes = data.notes

    db.commit()
    db.refresh(exercise)

    return serialize_exercise(exercise)


@router.delete(
    "/{exercise_id}",
    status_code=204,
)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
):
    exercise = db.get(
        Exercise,
        exercise_id,
    )

    if exercise is None:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    db.delete(exercise)
    db.commit()

    return Response(status_code=204)
