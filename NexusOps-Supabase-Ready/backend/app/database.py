from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = ""
    frontend_origin: str = "http://localhost:5173"
    monitor_interval_seconds: int = 60
    enable_monitoring: bool = True
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        extra="ignore",
    )


settings = Settings()
if not settings.database_url:
    raise RuntimeError("DATABASE_URL manquante : renseignez backend/.env avec la connexion Supabase")

database_url = make_url(settings.database_url)
if database_url.drivername in {"postgres", "postgresql"}:
    database_url = database_url.set(drivername="postgresql+psycopg")

engine = create_engine(database_url, pool_pre_ping=True, pool_recycle=1800, connect_args={"connect_timeout": 10})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
