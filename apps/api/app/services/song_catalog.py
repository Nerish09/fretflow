from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json
import time


MUSICBRAINZ_SEARCH_URL = "https://musicbrainz.org/ws/2/recording/"

USER_AGENT = "FretFlow/1.0 (https://github.com/Nerish09/fretflow)"


@dataclass
class CatalogSong:
    id: str
    title: str
    artist: str
    release: str | None = None
    release_date: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _artist_name(recording: dict[str, Any]) -> str:
    artist_credit = recording.get("artist-credit") or []
    names: list[str] = []

    for credit in artist_credit:
        if not isinstance(credit, dict):
            continue

        artist = credit.get("artist") or {}
        name = artist.get("name") or credit.get("name")

        if name:
            names.append(str(name))

    return ", ".join(names) if names else "Unknown artist"


def _release_info(
    recording: dict[str, Any],
) -> tuple[str | None, str | None]:
    releases = recording.get("releases") or []

    if not releases:
        return None, None

    release = releases[0]

    return (
        release.get("title"),
        release.get("date"),
    )


def _request_musicbrainz(
    query: str,
    limit: int,
) -> dict[str, Any]:
    params = urlencode(
        {
            "query": query,
            "fmt": "json",
            "limit": limit,
        }
    )

    request = Request(
        f"{MUSICBRAINZ_SEARCH_URL}?{params}",
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        },
    )

    last_error: Exception | None = None

    for attempt in range(3):
        try:
            with urlopen(request, timeout=10) as response:
                return json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as exc:
            last_error = exc

            # Retry temporary upstream/rate-limit failures.
            if exc.code in {429, 500, 502, 503, 504}:
                if attempt < 2:
                    time.sleep(attempt + 1)
                    continue

            raise RuntimeError(
                f"Song catalog provider returned HTTP {exc.code}."
            ) from exc

        except URLError as exc:
            last_error = exc

            if attempt < 2:
                time.sleep(attempt + 1)
                continue

        except TimeoutError as exc:
            last_error = exc

            if attempt < 2:
                time.sleep(attempt + 1)
                continue

        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Song catalog returned invalid data."
            ) from exc

    raise RuntimeError(
        "Song catalog provider is temporarily unavailable."
    ) from last_error


def search_song_catalog(
    query: str,
    limit: int = 10,
) -> list[dict[str, Any]]:
    cleaned_query = query.strip()

    if len(cleaned_query) < 2:
        return []

    safe_limit = max(1, min(limit, 20))

    payload = _request_musicbrainz(
        query=cleaned_query,
        limit=safe_limit,
    )

    results: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    for recording in payload.get("recordings", []):
        title = str(
            recording.get("title") or ""
        ).strip()

        if not title:
            continue

        artist = _artist_name(recording)

        dedupe_key = (
            title.casefold(),
            artist.casefold(),
        )

        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)

        release, release_date = _release_info(recording)

        song = CatalogSong(
            id=str(recording.get("id") or ""),
            title=title,
            artist=artist,
            release=release,
            release_date=release_date,
        )

        results.append(song.to_dict())

        if len(results) >= safe_limit:
            break

    return results
