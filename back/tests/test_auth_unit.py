from back.services.auth import hash_password, verify_password, create_access_token


def test_hash_password_changes_value():
    password = "123456"
    hashed = hash_password(password)

    assert hashed != password
    assert isinstance(hashed, str)


def test_verify_password_success():
    password = "123456"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_fail():
    password = "123456"
    hashed = hash_password(password)

    assert verify_password("wrong", hashed) is False


def test_create_access_token_returns_string():
    token = create_access_token({"sub": "testuser"})

    assert isinstance(token, str)
    assert len(token) > 10