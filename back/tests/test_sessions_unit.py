from datetime import datetime, timedelta
from types import SimpleNamespace

from back.services.sessions import SessionService, _hash_token


class FakeRepo:
    def __init__(self):
        self.created = []
        self.revoked = []
        self.by_jti = {}
        self.revoked_all_for_user = []

    def create(self, db, *, jti, token_hash, user_id, expires_at):
        obj = SimpleNamespace(
            jti=jti,
            token_hash=token_hash,
            user_id=user_id,
            expires_at=expires_at,
            revoked=False,
        )
        self.by_jti[jti] = obj
        self.created.append(obj)
        return obj

    def get_by_jti(self, db, jti):
        return self.by_jti.get(jti)

    def revoke(self, db, rt):
        rt.revoked = True
        self.revoked.append(rt)

    def revoke_all_for_user(self, db, user_id):
        self.revoked_all_for_user.append(user_id)


class FakeQuery:
    def __init__(self, user):
        self.user = user

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.user


class FakeDB:
    def __init__(self, user):
        self.user = user

    def query(self, model):
        return FakeQuery(self.user)


def test_hash_token_is_deterministic():
    value = "abc"
    assert _hash_token(value) == _hash_token(value)


def test_issue_tokens_returns_access_and_refresh():
    repo = FakeRepo()
    service = SessionService(repo)
    user = SimpleNamespace(id=1, username="testuser")
    db = FakeDB(user)

    tokens = service.issue_tokens(db, user)

    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"
    assert len(repo.created) == 1


def test_logout_with_invalid_token_does_not_crash():
    repo = FakeRepo()
    service = SessionService(repo)
    db = FakeDB(None)

    service.logout(db, "bad-token", all_sessions=False)

    assert repo.revoked == []


def test_logout_all_sessions_revokes_user_tokens():
    repo = FakeRepo()
    service = SessionService(repo)
    user = SimpleNamespace(id=5, username="testuser")
    db = FakeDB(user)

    tokens = service.issue_tokens(db, user)
    service.logout(db, tokens["refresh_token"], all_sessions=True)

    assert repo.revoked_all_for_user == [5]