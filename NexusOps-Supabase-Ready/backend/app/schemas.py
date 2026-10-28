from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator


class EquipmentData(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: str = Field(min_length=1, max_length=80)
    site: str = Field(min_length=1, max_length=80)
    monitor_host: str | None = Field(default=None, max_length=255)
    monitoring_enabled: bool = False

    @field_validator("name", "type", "site")
    @classmethod
    def nonempty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Ce champ est obligatoire")
        return value

    @field_validator("monitor_host")
    @classmethod
    def host_clean(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class EquipmentOut(EquipmentData):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: Literal["online", "offline", "unknown"]
    last_checked_at: datetime | None
    response_ms: int | None


class IncidentData(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    severity: Literal["high", "medium", "low"]
    status: Literal["open", "in_progress", "resolved"]
    equipmentId: int = Field(gt=0)

    @field_validator("title")
    @classmethod
    def title_clean(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Titre obligatoire")
        return value


class IncidentOut(IncidentData):
    id: int


class UserData(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=160)
    role: Literal["admin", "operator", "viewer"]

    @field_validator("name", "email")
    @classmethod
    def strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, value: str) -> str:
        import re
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("E-mail invalide")
        return value.lower()


class UserOut(UserData):
    model_config = ConfigDict(from_attributes=True)
    id: int
