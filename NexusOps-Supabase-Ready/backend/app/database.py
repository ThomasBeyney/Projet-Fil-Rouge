from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = ""
    frontend_origin: str = "http://localhost:5173"
    monitor_interval_seconds: int = 60
    enable_monitoring: bool = True
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
if not settings.database_url:
    raise RuntimeError("DATABASE_URL manquante : renseignez backend/.env avec la connexion Supabase")
engine = create_engine(settings.database_url, pool_pre_ping=True, pool_recycle=1800, connect_args={"connect_timeout": 10})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
