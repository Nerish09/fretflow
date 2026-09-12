from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    artist: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    current_bpm: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=60,
    )

    target_bpm: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=100,
    )

    difficulty: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Intermediate",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Learning",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
