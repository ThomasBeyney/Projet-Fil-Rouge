from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import get_db, settings
from .models import User

bearer_scheme = HTTPBearer(auto_error=False)
password_hasher = PasswordHash.recommended()
TOKEN_ALGORITHM = "HS256"
TOKEN_LIFETIME_SECONDS = 3600


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def require_auth_secret() -> str:
    if not settings.auth_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTH_SECRET_KEY manquante : configurez backend/.env.",
        )
    return settings.auth_secret_key


def get_directory_user(email: str, db: Session) -> User | None:
    normalized_email = email.strip().casefold()
    return db.scalar(
        select(User).where(func.lower(User.email) == normalized_email)
    )


def require_directory_user(email: str, db: Session) -> str:
    if get_directory_user(email, db) is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte NexusOps introuvable ou désactivé",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return email.strip().casefold()


async def authenticate(data: LoginRequest, db: Session) -> TokenResponse:
    secret = require_auth_secret()
    user = get_directory_user(data.email, db)
    if user is None or not user.password_hash or not verify_password(
        data.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse e-mail ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=TOKEN_LIFETIME_SECONDS)
    access_token = jwt.encode(
        {
            "sub": user.email.casefold(),
            "iat": now,
            "exp": expires_at,
        },
        secret,
        algorithm=TOKEN_ALGORITHM,
    )
    return TokenResponse(
        access_token=access_token,
        expires_in=TOKEN_LIFETIME_SECONDS,
    )


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

    secret = require_auth_secret()
    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=[TOKEN_ALGORITHM],
            options={"require": ["exp", "iat", "sub"]},
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    email = payload.get("sub")
    if not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return require_directory_user(email, db)


def require_admin(
    email: Annotated[str, Depends(require_authenticated)],
    db: Annotated[Session, Depends(get_db)],
) -> str:
    user = get_directory_user(email, db)
    if user is None or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits administrateur requis",
        )
    return email
