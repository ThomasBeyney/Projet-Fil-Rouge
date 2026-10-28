import asyncio
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .database import get_db, settings
from .models import Equipment, Incident, User, MonitoringCheck
from .schemas import EquipmentData, EquipmentOut, IncidentData, IncidentOut, UserData, UserOut
from .monitor import check_equipment, monitor_loop, safe_target


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tables provisioned in Supabase; never mutate schema at API startup.
    task = asyncio.create_task(monitor_loop()) if settings.enable_monitoring else None
    yield
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="NexusOps API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type"])


def get_or_404(db: Session, model, id: int):
    item = db.get(model, id)
    if item is None:
        raise HTTPException(404, "Ressource introuvable")
    return item


def commit(db: Session):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Conflit : nom ou e-mail déjà utilisé, ou ressource liée") from exc


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/equipment", response_model=list[EquipmentOut])
def list_equipment(db: Session = Depends(get_db)):
    return db.scalars(select(Equipment).order_by(Equipment.id)).all()


@app.post("/api/equipment", response_model=EquipmentOut, status_code=201)
def create_equipment(data: EquipmentData, db: Session = Depends(get_db)):
    if data.monitoring_enabled and not data.monitor_host:
        raise HTTPException(422, "Renseignez une IP pour activer la supervision")
    if data.monitor_host:
        try: safe_target(data.monitor_host)
        except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    item = Equipment(**data.model_dump(), status="unknown")
    db.add(item); commit(db); db.refresh(item)
    return item


@app.put("/api/equipment/{id}", response_model=EquipmentOut)
def update_equipment(id: int, data: EquipmentData, db: Session = Depends(get_db)):
    item = get_or_404(db, Equipment, id)
    if data.monitoring_enabled and not data.monitor_host:
        raise HTTPException(422, "Renseignez une IP pour activer la supervision")
    if data.monitor_host:
        try: safe_target(data.monitor_host)
        except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    changed_target = item.monitor_host != data.monitor_host or item.monitoring_enabled != data.monitoring_enabled
    for key, value in data.model_dump().items(): setattr(item, key, value)
    if changed_target or not item.monitoring_enabled:
        item.status = "unknown"; item.response_ms = None; item.last_checked_at = None
    commit(db); db.refresh(item)
    return item


@app.delete("/api/equipment/{id}", status_code=204)
def delete_equipment(id: int, db: Session = Depends(get_db)):
    item = get_or_404(db, Equipment, id)
    if db.scalar(select(Incident.id).where(Incident.equipment_id == id).limit(1)) is not None:
        raise HTTPException(409, "Supprimez d'abord les incidents liés à cet équipement")
    db.delete(item); commit(db)
    return Response(status_code=204)


@app.post("/api/equipment/{id}/check", response_model=EquipmentOut)
async def check_now(id: int, db: Session = Depends(get_db)):
    item = get_or_404(db, Equipment, id)
    if not item.monitoring_enabled or not item.monitor_host:
        raise HTTPException(409, "Supervision non configurée pour cet équipement")
    await check_equipment(id)
    db.expire_all()
    return get_or_404(db, Equipment, id)


def incident_out(item: Incident) -> IncidentOut:
    return IncidentOut(id=item.id, title=item.title, severity=item.severity, status=item.status, equipmentId=item.equipment_id)


@app.get("/api/incidents", response_model=list[IncidentOut])
def list_incidents(db: Session = Depends(get_db)):
    return [incident_out(i) for i in db.scalars(select(Incident).order_by(Incident.id)).all()]


@app.post("/api/incidents", response_model=IncidentOut, status_code=201)
def create_incident(data: IncidentData, db: Session = Depends(get_db)):
    get_or_404(db, Equipment, data.equipmentId)
    item = Incident(title=data.title, severity=data.severity, status=data.status, equipment_id=data.equipmentId)
    db.add(item); commit(db); db.refresh(item)
    return incident_out(item)


@app.put("/api/incidents/{id}", response_model=IncidentOut)
def update_incident(id: int, data: IncidentData, db: Session = Depends(get_db)):
    item = get_or_404(db, Incident, id)
    get_or_404(db, Equipment, data.equipmentId)
    item.title = data.title; item.severity = data.severity; item.status = data.status; item.equipment_id = data.equipmentId
    commit(db); db.refresh(item)
    return incident_out(item)


@app.delete("/api/incidents/{id}", status_code=204)
def delete_incident(id: int, db: Session = Depends(get_db)):
    db.delete(get_or_404(db, Incident, id)); commit(db)
    return Response(status_code=204)


@app.get("/api/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.id)).all()


@app.post("/api/users", response_model=UserOut, status_code=201)
def create_user(data: UserData, db: Session = Depends(get_db)):
    item = User(**data.model_dump())
    db.add(item); commit(db); db.refresh(item)
    return item


@app.put("/api/users/{id}", response_model=UserOut)
def update_user(id: int, data: UserData, db: Session = Depends(get_db)):
    item = get_or_404(db, User, id)
    for key, value in data.model_dump().items(): setattr(item, key, value)
    commit(db); db.refresh(item)
    return item


@app.delete("/api/users/{id}", status_code=204)
def delete_user(id: int, db: Session = Depends(get_db)):
    db.delete(get_or_404(db, User, id)); commit(db)
    return Response(status_code=204)


@app.get("/api/equipment/{id}/history")
def equipment_history(id: int, limit: int = 50, db: Session = Depends(get_db)):
    get_or_404(db, Equipment, id)
    limit = max(1, min(limit, 500))
    checks = db.scalars(select(MonitoringCheck).where(MonitoringCheck.equipment_id == id).order_by(MonitoringCheck.checked_at.desc()).limit(limit)).all()
    return [{"id": c.id, "checked_at": c.checked_at, "status": c.status, "response_ms": c.response_ms, "error": c.error} for c in checks]
