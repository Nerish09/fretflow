from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_song_catalog_query_validation():
    response = client.get(
        "/songs/catalog/search?q=a"
    )

    assert response.status_code == 422


def test_song_catalog_limit_validation():
    response = client.get(
        "/songs/catalog/search?q=hotel&limit=50"
    )

    assert response.status_code == 422
