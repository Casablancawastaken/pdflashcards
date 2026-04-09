from datetime import datetime

from back.models.flashcards import Flashcard
from back.models.upload import Upload, UploadStatus


def test_get_cards_success(client, user, db_session):
    upload = Upload(
        user_id=user.id,
        filename="cards.pdf",
        title="cards",
        object_key="user_1/cards.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )
    db_session.add(upload)
    db_session.commit()
    db_session.refresh(upload)

    card1 = Flashcard(upload_id=upload.id, question="Q1", answer="A1")
    card2 = Flashcard(upload_id=upload.id, question="Q2", answer="A2")
    db_session.add_all([card1, card2])
    db_session.commit()

    response = client.get(
        f"/cards/{upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["question"] == "Q1"
    assert data[0]["answer"] == "A1"


def test_get_cards_not_found(client, user):
    response = client.get(
        "/cards/9999",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Файл не найден"


def test_get_cards_forbidden_for_other_user(client, user, admin, db_session):
    other_upload = Upload(
        user_id=admin.id,
        filename="other.pdf",
        title="other",
        object_key="user_2/other.pdf",
        content_type="application/pdf",
        size=100,
        timestamp=datetime.utcnow(),
        status=UploadStatus.done,
    )
    db_session.add(other_upload)
    db_session.commit()
    db_session.refresh(other_upload)

    card = Flashcard(upload_id=other_upload.id, question="Secret", answer="Hidden")
    db_session.add(card)
    db_session.commit()

    response = client.get(
        f"/cards/{other_upload.id}",
        headers={"Authorization": _get_auth_header(client)},
    )

    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "Forbidden"


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