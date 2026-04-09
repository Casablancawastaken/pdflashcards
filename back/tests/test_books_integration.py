from datetime import datetime

from back.models.upload import Upload, UploadStatus


def test_get_books_by_upload_success(client, user, db_session, monkeypatch):
    import back.routers.books as books_router

    upload = Upload(
        user_id=user.id,
        filename="python.pdf",
        title="Python",
        object_key="user_1/python.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    def fake_search_books(query: str):
        return {
            "items": [
                {
                    "id": "1",
                    "title": "Python Basics",
                    "authors": ["Author 1"],
                    "description": "Test description",
                    "thumbnail": None,
                    "info_url": "http://example.com",
                    "published_date": "2024",
                }
            ],
            "source": "google_books",
        }

    monkeypatch.setattr(books_router, "search_books", fake_search_books)

    response = client.get(
        f"/books/by-upload/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Python Basics"


def test_get_books_by_upload_not_found(client, user):
    response = client.get(
        "/books/by-upload/9999",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Файл не найден"


def test_get_books_by_upload_forbidden(client, user, admin, db_session):
    other_upload = Upload(
        user_id=admin.id,
        filename="secret.pdf",
        title="Secret",
        object_key="user_2/secret.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )
    db_session.add(other_upload)
    db_session.commit()
    db_session.refresh(other_upload)

    response = client.get(
        f"/books/by-upload/{other_upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "Forbidden"


def test_get_books_by_upload_rate_limit(client, user, db_session, monkeypatch):
    import back.routers.books as books_router

    upload = Upload(
        user_id=user.id,
        filename="python.pdf",
        title="Python",
        object_key="user_1/python.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    def fake_search_books(query: str):
        raise RuntimeError("Rate limit exceeded")

    monkeypatch.setattr(books_router, "search_books", fake_search_books)

    response = client.get(
        f"/books/by-upload/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 429
    data = response.json()
    assert data["detail"] == "Слишком много запросов к внешнему API"


def test_get_books_by_upload_external_error(client, user, db_session, monkeypatch):
    import back.routers.books as books_router

    upload = Upload(
        user_id=user.id,
        filename="python.pdf",
        title="Python",
        object_key="user_1/python.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    def fake_search_books(query: str):
        raise RuntimeError("external_api_error")

    monkeypatch.setattr(books_router, "search_books", fake_search_books)

    response = client.get(
        f"/books/by-upload/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 502
    data = response.json()
    assert data["detail"] == "Внешний API временно недоступен"


def _get_auth_header(client):
    login_response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "123456",
        },
    )
    token = login_response.json()["access_token"]
    return f"Bearer {token}"