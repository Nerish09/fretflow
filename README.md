# FretFlow

FretFlow is a personal guitar practice and progress-tracking application.

The goal is to make practice more structured, measurable, and enjoyable without making the workflow complicated.

## Planned Features

- Songs and exercises
- Current BPM and target BPM tracking
- Difficulty levels
- Practice sessions
- Practice timers
- Session history
- Progress tracking
- Weekly practice statistics
- Practice streaks
- Notes
- Progress charts
- Metronome
- Practice recommendations based on progress

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic

### Database

- PostgreSQL
- Docker

### Testing

- Pytest
- FastAPI TestClient

## Architecture

```text
Next.js / React / TypeScript
            |
            | REST API
            v
       FastAPI / Python
            |
            v
        SQLAlchemy
            |
            v
        PostgreSQL
            |
            v
          Docker
```

fretflow/
│
├── apps/
│ ├── api/
│ │ ├── app/
│ │ │ ├── api/
│ │ │ │ └── routes/
│ │ │ ├── models/
│ │ │ ├── database.py
│ │ │ └── main.py
│ │ └── tests/
│ │
│ └── web/
│ ├── app/
│ └── public/
│
├── docker-compose.yml
├── README.md
└── .gitignore
