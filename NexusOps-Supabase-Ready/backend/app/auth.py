from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import get_db, settings
from .models import User

bearer_scheme = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def supabase_auth_url(path: str) -> str:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Authentification Supabase non configurée : définissez "
                "SUPABASE_URL et SUPABASE_ANON_KEY dans backend/.env."
            ),
        )
    return f"{settings.supabase_url.rstrip('/')}/auth/v1/{path}"


def require_directory_user(email: str, db: Session) -> str:
    normalized_email = email.strip().casefold()
    user_id = db.scalar(
        select(User.id).where(func.lower(User.email) == normalized_email)
    )
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte n'est pas autorisé dans l'annuaire NexusOps",
        )
    return normalized_email


async def supabase_request(
    method: str,
    path: str,
    *,
    access_token: str | None = None,
    json: dict | None = None,
) -> httpx.Response:
    url = supabase_auth_url(path)
    headers = {"apikey": settings.supabase_anon_key}
    if access_token is not None:
        headers["Authorization"] = f"Bearer {access_token}"

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            return await client.request(method, url, headers=headers, json=json)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le service d'authentification Supabase est indisponible",
        ) from exc


async def authenticate(data: LoginRequest, db: Session) -> TokenResponse:
    response = await supabase_request(
        "POST",
        "token?grant_type=password",
        json={"email": data.email.strip(), "password": data.password},
    )
    if response.status_code in {400, 401, 422}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse e-mail ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if response.is_error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase n'a pas pu traiter la demande de connexion",
        )

    try:
        payload = response.json()
        access_token = payload["access_token"]
        expires_in = payload["expires_in"]
        email = payload["user"]["email"]
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Réponse d'authentification Supabase invalide",
        ) from exc

    if not isinstance(access_token, str) or not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Réponse d'authentification Supabase invalide",
        )
    require_directory_user(email, db)
    return TokenResponse(access_token=access_token, expires_in=expires_in)


async def require_authenticated(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: Annotated[Session, Depends(get_db)],
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    response = await supabase_request(
        "GET",
        "user",
        access_token=credentials.credentials,
    )
    if response.status_code in {401, 403}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton Supabase invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if response.is_error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le service d'authentification Supabase est indisponible",
        )

    try:
        email = response.json()["email"]
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Réponse d'authentification Supabase invalide",
        ) from exc
    if not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Réponse d'authentification Supabase invalide",
        )
    return require_directory_user(email, db)
