from fastapi import APIRouter, HTTPException, Query

from app.services.song_catalog import search_song_catalog


router = APIRouter(
    prefix="/songs/catalog",
    tags=["Song Catalog"],
)


@router.get("/search")
def search_catalog(
    q: str = Query(
        ...,
        min_length=2,
        max_length=120,
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=20,
    ),
):
    try:
        results = search_song_catalog(
            query=q,
            limit=limit,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    return {
        "query": q,
        "count": len(results),
        "results": results,
    }
