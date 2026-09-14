# FretFlow

FretFlow is a personal guitar practice tracker designed to make practice more focused, measurable, and consistent.

It combines song and technique tracking, timed practice sessions, a metronome, automatic BPM history, smart daily practice planning, practice goals, streaks, and progress analytics.

## Features

### Songs

- Add, edit, and delete songs
- Track current BPM and target BPM
- Track difficulty and learning status
- View percentage progress toward target tempo

### Drills

- Maintain a technique and exercise library
- Track categories such as scales, chords, rhythm, warm-ups, and picking exercises
- Track current and target BPM

### Practice Room

- Practice songs, drills, or custom exercises
- Built-in timer
- Built-in metronome
- Adjustable BPM
- Session notes
- Save completed sessions
- Automatically update current BPM after a successful session
- Manual quick logging for sessions practiced outside the timer

### Today

- Choose a 20, 30, 45, or 60 minute practice session
- Automatically builds a practice plan
- Prioritizes songs with the largest BPM gap
- Includes warm-up blocks
- Fills the requested practice duration
- Opens each practice block directly in the Practice Room

### Progress

- Daily practice goal
- Rolling 7-day practice goal
- Current streak
- Longest streak
- Active practice days
- Weekly practice visualization
- BPM history for songs and drills

### Dashboard

- Practice-time summary
- Current streak
- Song count
- Average song progress
- Daily goal progress
- Songs needing attention
- Recent practice history

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- CSS

### Backend

- FastAPI
- Python
- SQLAlchemy
- Pydantic
- PostgreSQL

### Testing

- Pytest
- FastAPI TestClient

### Infrastructure

- Docker Compose

## Project Structure

```text
fretflow/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── routes/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── database.py
│   │   │   └── main.py
│   │   └── tests/
│   │
│   └── web/
│       ├── app/
│       │   └── dashboard/
│       └── lib/
│
├── docker-compose.yml
├── README.md
└── .gitignore
```
