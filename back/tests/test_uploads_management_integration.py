from datetime import datetime

from back.models.upload import Upload, UploadStatus


def test_get_user_uploads(client, user, db_session):
    upload1 = Upload(
        user_id=user.id,
        filename="file1.pdf",
        title="file1",
        object_key="user_1/file1.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.uploaded,
    )
    upload2 = Upload(
        user_id=user.id,
        filename="file2.pdf",
        title="file2",
        object_key="user_1/file2.pdf",
        content_type="application/pdf",
        size=200,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )

    db_session.add_all([upload1, upload2])
    db_session.commit()

    response = client.get(
        "/uploads/",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    assert "page" in data
    assert "pages" in data
    assert "total" in data
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_update_upload_title_success(client, user, db_session):
    upload = Upload(
        user_id=user.id,
        filename="old.pdf",
        title="old title",
        object_key="user_1/old.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.uploaded,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    response = client.put(
        f"/uploads/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
        json={"title": "new title"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "new title"
    assert data["filename"] == "old.pdf"


def test_update_upload_title_empty_fails(client, user, db_session):
    upload = Upload(
        user_id=user.id,
        filename="old.pdf",
        title="old title",
        object_key="user_1/old.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.uploaded,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    response = client.put(
        f"/uploads/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
        json={"title": "   "},
    )

    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Название не может быть пустым"


def test_update_upload_title_duplicate_fails(client, user, db_session):
    upload1 = Upload(
        user_id=user.id,
        filename="file1.pdf",
        title="title1",
        object_key="user_1/file1.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.uploaded,
    )
    upload2 = Upload(
        user_id=user.id,
        filename="file2.pdf",
        title="title2",
        object_key="user_1/file2.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.uploaded,
    )

    db_session.add_all([upload1, upload2])
    db_session.commit()
    db_session.refresh(upload2)

    response = client.put(
        f"/uploads/{upload2.id}",
        headers={"Authorization": _get_auth_header(client)},
        json={"title": "title1"},
    )

    assert response.status_code == 409
    data = response.json()
    assert data["detail"] == "У вас уже есть файл с таким названием"


def test_clear_user_uploads(client, user, db_session, monkeypatch):
    import back.routers.uploads as uploads_router

    monkeypatch.setattr(uploads_router, "delete_object", lambda object_key: None)

    upload1 = Upload(
        user_id=user.id,
        filename="file1.pdf",
        title="file1",
        object_key="user_1/file1.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.uploaded,
    )
    upload2 = Upload(
        user_id=user.id,
        filename="file2.pdf",
        title="file2",
        object_key="user_1/file2.pdf",
        content_type="application/pdf",
        size=200,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )

    db_session.add_all([upload1, upload2])
    db_session.commit()

    response = client.delete(
        "/uploads/clear",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "История загрузок успешно очищена"

    check_response = client.get(
        "/uploads/",
        headers={"Authorization": _get_auth_header(client)},
    )
    check_data = check_response.json()
    assert check_data["total"] == 0


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