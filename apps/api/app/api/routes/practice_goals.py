from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.practice_session import PracticeSession


router = APIRouter(
    prefix="/practice-goals",
    tags=["Practice Goals"],
)


def session_date(
    started_at: datetime,
) -> date:
    if started_at.tzinfo is None:
        return started_at.date()

    return started_at.astimezone(
        timezone.utc
    ).date()


def calculate_current_streak(
    practice_days: set[date],
    today: date,
) -> int:
    if not practice_days:
        return 0

    if today in practice_days:
        cursor = today

    elif (
        today - timedelta(days=1)
    ) in practice_days:
        cursor = (
            today - timedelta(days=1)
        )

    else:
        return 0

    streak = 0

    while cursor in practice_days:
        streak += 1

        cursor -= timedelta(
            days=1
        )

    return streak


def calculate_longest_streak(
    practice_days: set[date],
) -> int:
    if not practice_days:
        return 0

    ordered_days = sorted(
        practice_days
    )

    longest = 1
    current = 1

    for index in range(
        1,
        len(ordered_days),
    ):
        difference = (
            ordered_days[index]
            - ordered_days[index - 1]
        ).days

        if difference == 1:
            current += 1

            longest = max(
                longest,
                current,
            )

        else:
            current = 1

    return longest


def calculate_percentage(
    current: int,
    goal: int,
) -> int:
    if goal <= 0:
        return 0

    return min(
        100,
        round(
            (current / goal) * 100
        ),
    )


@router.get("")
def get_practice_goals(
    daily_goal: int = Query(
        default=30,
        ge=1,
        le=480,
    ),
    weekly_goal: int = Query(
        default=180,
        ge=1,
        le=3360,
    ),
    db: Session = Depends(get_db),
):
    sessions = db.scalars(
        select(
            PracticeSession
        ).order_by(
            PracticeSession.started_at.asc()
        )
    ).all()

    today = datetime.now(
        timezone.utc
    ).date()

    week_start = (
        today
        - timedelta(
            days=6
        )
    )

    today_minutes = 0
    weekly_minutes = 0

    practice_days: set[date] = set()

    for session in sessions:
        day = session_date(
            session.started_at
        )

        if (
            session.duration_minutes
            > 0
        ):
            practice_days.add(
                day
            )

        if day == today:
            today_minutes += (
                session.duration_minutes
            )

        if (
            week_start
            <= day
            <= today
        ):
            weekly_minutes += (
                session.duration_minutes
            )

    current_streak = (
        calculate_current_streak(
            practice_days,
            today,
        )
    )

    longest_streak = (
        calculate_longest_streak(
            practice_days
        )
    )

    daily_remaining = max(
        0,
        daily_goal
        - today_minutes,
    )

    weekly_remaining = max(
        0,
        weekly_goal
        - weekly_minutes,
    )

    return {
        "daily": {
            "goal_minutes": daily_goal,
            "completed_minutes": today_minutes,
            "remaining_minutes": daily_remaining,
            "progress_percent": calculate_percentage(
                today_minutes,
                daily_goal,
            ),
            "completed": (
                today_minutes
                >= daily_goal
            ),
        },
        "weekly": {
            "goal_minutes": weekly_goal,
            "completed_minutes": weekly_minutes,
            "remaining_minutes": weekly_remaining,
            "progress_percent": calculate_percentage(
                weekly_minutes,
                weekly_goal,
            ),
            "completed": (
                weekly_minutes
                >= weekly_goal
            ),
            "window_days": 7,
        },
        "streaks": {
            "current": current_streak,
            "longest": longest_streak,
            "practice_days": len(
                practice_days
            ),
        },
    }
