def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "123456",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "role" in data


def test_login_user(client, user):
    response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "123456",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_wrong_password(client, user):
    response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data

def test_auth_me(client, user):
    login_response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "123456",
        },
    )
    tokens = login_response.json()

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@example.com"
    assert data["role"] == "user"


def test_auth_me_unauthorized(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_refresh_token(client, user):
    login_response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "123456",
        },
    )
    tokens = login_response.json()

    response = client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_refresh_token_invalid(client):
    response = client.post(
        "/auth/refresh",
        json={"refresh_token": "bad-token"},
    )

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_logout(client, user):
    login_response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "123456",
        },
    )
    tokens = login_response.json()

    response = client.post(
        "/auth/logout",
        json={
            "refresh_token": tokens["refresh_token"],
            "all_sessions": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Logged out"


def test_refresh_after_logout_fails(client, user):
    login_response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "password": "123456",
        },
    )
    tokens = login_response.json()

    logout_response = client.post(
        "/auth/logout",
        json={
            "refresh_token": tokens["refresh_token"],
            "all_sessions": False,
        },
    )
    assert logout_response.status_code == 200

    refresh_response = client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert refresh_response.status_code == 401