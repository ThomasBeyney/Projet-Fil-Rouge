import pytest
from fastapi.testclient import TestClient
from types import SimpleNamespace

from app import auth
from app.database import get_db, settings
from app.main import app


class DirectorySession:
    def __init__(self, user):
        self.user = user
        self.added = []

    def scalar(self, _query):
        return self.user

    def add(self, item):
        self.added.append(item)

    def commit(self):
        pass

    def refresh(self, item):
        item.id = 3


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        settings,
        "auth_secret_key",
        "test-secret-key-at-least-32-bytes-long",
    )
    monkeypatch.setattr(settings, "enable_monitoring", False)
    user = SimpleNamespace(
        id=1,
        name="Admin",
        email="admin@example.com",
        role="admin",
        password_hash=auth.hash_password("correct-password-123"),
    )
    app.dependency_overrides[get_db] = lambda: DirectorySession(user)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_data_routes_require_authentication(client):
    assert client.get("/api/health").status_code == 200
    response = client.get("/api/equipment")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_login_uses_database_password_and_protects_routes(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "correct-password-123"},
    )

    assert response.status_code == 200
    assert response.json()["expires_in"] == 3600
    assert client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    ).json() == {"email": "admin@example.com"}


def test_login_rejects_invalid_database_password(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password-123"},
    )

    assert response.status_code == 401


def test_removed_account_cannot_use_an_existing_token(client):
    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "correct-password-123"},
    )
    app.dependency_overrides[get_db] = lambda: DirectorySession(None)
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 401


def test_login_fails_closed_without_token_secret(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_secret_key", "")
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "some-password"},
    )

    assert response.status_code == 503


def test_non_admin_cannot_manage_user_accounts(client):
    app.dependency_overrides[get_db] = lambda: DirectorySession(
        SimpleNamespace(
            id=2,
            name="Operator",
            email="operator@example.com",
            role="operator",
            password_hash=auth.hash_password("operator-password-123"),
        )
    )
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "operator@example.com",
            "password": "operator-password-123",
        },
    )
    response = client.post(
        "/api/users",
        headers={
            "Authorization": f"Bearer {login_response.json()['access_token']}"
        },
        json={
            "name": "New user",
            "email": "new@example.com",
            "role": "viewer",
            "password": "new-user-password-123",
        },
    )

    assert response.status_code == 403


def test_admin_creates_user_with_hashed_password_only(client):
    session = DirectorySession(
        SimpleNamespace(
            id=1,
            name="Admin",
            email="admin@example.com",
            role="admin",
            password_hash=auth.hash_password("correct-password-123"),
        )
    )
    app.dependency_overrides[get_db] = lambda: session
    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "correct-password-123"},
    )
    response = client.post(
        "/api/users",
        headers={
            "Authorization": f"Bearer {login_response.json()['access_token']}"
        },
        json={
            "name": "New user",
            "email": "new@example.com",
            "role": "viewer",
            "password": "new-user-password-123",
        },
    )

    assert response.status_code == 201
    assert "password_hash" not in response.json()
    assert auth.verify_password("new-user-password-123", session.added[0].password_hash)


def test_passwords_are_stored_as_argon2_hashes():
    encoded = auth.hash_password("correct-password-123")

    assert encoded.startswith("$argon2id$")
    assert encoded != "correct-password-123"
    assert auth.verify_password("correct-password-123", encoded)
    assert not auth.verify_password("wrong-password-123", encoded)
