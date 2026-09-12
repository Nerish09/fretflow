from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.exercises import router as exercises_router
from app.api.routes.health import router as health_router
from app.api.routes.practice_sessions import (
    router as practice_sessions_router,
)
from app.api.routes.songs import router as songs_router
from app.database import Base, engine

import app.models


Base.metadata.create_all(
    bind=engine,
)


app = FastAPI(
    title="FretFlow API",
    version="0.2.0",
    description="Backend API for FretFlow guitar practice tracking.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router)
app.include_router(songs_router)
app.include_router(exercises_router)
app.include_router(practice_sessions_router)


@app.get("/")
def root():
    return {
        "name": "FretFlow API",
        "version": "0.2.0",
        "status": "running",
    }
