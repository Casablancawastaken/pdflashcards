from io import BytesIO


def test_upload_pdf_success(client, user, monkeypatch):
    import back.routers.upload as upload_router

    monkeypatch.setattr(upload_router, "ensure_bucket", lambda: None)
    monkeypatch.setattr(upload_router, "upload_bytes", lambda data, object_key, content_type: None)

    fake_pdf = b"%PDF-1.4 test pdf content"

    response = client.post(
        "/upload-pdf",
        headers={"Authorization": _get_auth_header(client)},
        files={"file": ("test.pdf", BytesIO(fake_pdf), "application/pdf")},
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["filename"] == "test.pdf"


def test_upload_non_pdf_fails(client, user, monkeypatch):
    import back.routers.upload as upload_router

    monkeypatch.setattr(upload_router, "ensure_bucket", lambda: None)

    response = client.post(
        "/upload-pdf",
        headers={"Authorization": _get_auth_header(client)},
        files={"file": ("test.txt", BytesIO(b"hello"), "text/plain")},
    )

    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Допустим только PDF"


def test_upload_empty_pdf_fails(client, user, monkeypatch):
    import back.routers.upload as upload_router

    monkeypatch.setattr(upload_router, "ensure_bucket", lambda: None)

    response = client.post(
        "/upload-pdf",
        headers={"Authorization": _get_auth_header(client)},
        files={"file": ("empty.pdf", BytesIO(b""), "application/pdf")},
    )

    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Файл пустой"


def test_upload_too_large_pdf_fails(client, user, monkeypatch):
    import back.routers.upload as upload_router

    monkeypatch.setattr(upload_router, "ensure_bucket", lambda: None)

    big_pdf = b"x" * (10 * 1024 * 1024 + 1)

    response = client.post(
        "/upload-pdf",
        headers={"Authorization": _get_auth_header(client)},
        files={"file": ("big.pdf", BytesIO(big_pdf), "application/pdf")},
    )

    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Файл превышает 10 МБ"


def test_delete_upload_success(client, user, db_session, monkeypatch):
    import back.routers.upload as upload_router
    import back.routers.uploads as uploads_router
    from back.models.upload import Upload

    monkeypatch.setattr(upload_router, "ensure_bucket", lambda: None)
    monkeypatch.setattr(upload_router, "upload_bytes", lambda data, object_key, content_type: None)
    monkeypatch.setattr(uploads_router, "delete_object", lambda object_key: None)

    upload = Upload(
        user_id=user.id,
        filename="to_delete.pdf",
        title="to_delete.pdf",
        object_key="user_1/test.pdf",
        content_type="application/pdf",
        size=123,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    response = client.delete(
        f"/uploads/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Файл удалён"


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