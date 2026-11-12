import httpx
import pytest
from fastapi.testclient import TestClient

from app import auth
from app.database import get_db, settings
from app.main import app


class DirectorySession:
    def __init__(self, allowed=True):
        self.allowed = allowed

    def scalar(self, _query):
        return 1 if self.allowed else None


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "supabase_anon_key", "test-anon-key")
    app.dependency_overrides[get_db] = lambda: DirectorySession()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_data_routes_require_authentication(client):
    assert client.get("/api/health").status_code == 200
    response = client.get("/api/equipment")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_login_uses_supabase_token_and_protects_routes(client, monkeypatch):
    async def supabase_login(method, path, *, access_token=None, json=None):
        if method == "POST" and path == "token?grant_type=password":
            assert json == {
                "email": "admin@example.com",
                "password": "supabase-password",
            }
            return httpx.Response(
                200,
                json={
                    "access_token": "supabase-access-token",
                    "expires_in": 3600,
                    "user": {"email": "admin@example.com"},
                },
            )
        assert method == "GET" and path == "user"
        assert access_token == "supabase-access-token"
        return httpx.Response(200, json={"email": "admin@example.com"})

    monkeypatch.setattr(auth, "supabase_request", supabase_login)
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "supabase-password"},
    )

    assert response.status_code == 200
    assert response.json()["expires_in"] == 3600
    assert client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer supabase-access-token"},
    ).json() == {"email": "admin@example.com"}


def test_login_rejects_invalid_supabase_credentials(client, monkeypatch):
    async def rejected_login(*_args, **_kwargs):
        return httpx.Response(400, json={"msg": "invalid credentials"})

    monkeypatch.setattr(auth, "supabase_request", rejected_login)
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_authenticated_account_must_exist_in_directory(client, monkeypatch):
    app.dependency_overrides[get_db] = lambda: DirectorySession(allowed=False)

    async def supabase_user(*_args, **_kwargs):
        return httpx.Response(200, json={"email": "not-listed@example.com"})

    monkeypatch.setattr(auth, "supabase_request", supabase_user)
    response = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer valid-supabase-token"}
    )

    assert response.status_code == 403


def test_login_fails_closed_without_supabase_configuration(client, monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", "")
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "some-password"},
    )

    assert response.status_code == 503
