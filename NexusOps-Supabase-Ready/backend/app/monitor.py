import asyncio
import ipaddress
import logging
import platform
import time
from datetime import datetime, timezone
from sqlalchemy import select
from .database import SessionLocal, settings
from .models import Equipment, MonitoringCheck

logger = logging.getLogger(__name__)


def safe_target(host: str) -> str:
    """Only explicitly configured private/loopback IPs may be probed."""
    try:
        ip = ipaddress.ip_address(host)
    except ValueError as exc:
        raise ValueError("Utilisez une adresse IP privée, pas un nom DNS") from exc
    allowed = ip.is_loopback or any(ip in net for net in (ipaddress.ip_network("10.0.0.0/8"), ipaddress.ip_network("172.16.0.0/12"), ipaddress.ip_network("192.168.0.0/16")))
    if not allowed:
        raise ValueError("Seules les IP privées ou loopback sont autorisées")
    return str(ip)


async def ping(host: str) -> tuple[str, int | None]:
    safe_target(host)
    args = ["ping", "-n", "1", "-w", "1500", host] if platform.system() == "Windows" else ["ping", "-c", "1", "-W", "2", host]
    started = time.monotonic()
    try:
        proc = await asyncio.create_subprocess_exec(*args, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        try:
            await asyncio.wait_for(proc.communicate(), timeout=4)
        except TimeoutError:
            proc.kill()
            await proc.communicate()
            return "offline", None
        if proc.returncode == 0:
            return "online", round((time.monotonic() - started) * 1000)
    except (OSError, ValueError) as exc:
        logger.warning("Ping impossible: %s", exc)
    return "offline", None


async def check_equipment(equipment_id: int) -> None:
    with SessionLocal() as db:
        item = db.get(Equipment, equipment_id)
        if not item or not item.monitoring_enabled or not item.monitor_host:
            return
        host = item.monitor_host
    try:
        status, response_ms = await ping(host)
    except ValueError:
        logger.warning("Adresse refusée pour équipement %s", equipment_id)
        return
    with SessionLocal() as db:
        item = db.get(Equipment, equipment_id)
        if item and item.monitoring_enabled and item.monitor_host == host:
            item.status = status
            item.response_ms = response_ms
            item.last_checked_at = datetime.now(timezone.utc)
            db.add(MonitoringCheck(equipment_id=equipment_id, status=status, response_ms=response_ms, checked_at=item.last_checked_at))
            db.commit()


async def monitor_loop() -> None:
    while True:
        try:
            with SessionLocal() as db:
                ids = db.scalars(select(Equipment.id).where(Equipment.monitoring_enabled.is_(True), Equipment.monitor_host.is_not(None))).all()
            for equipment_id in ids:
                await check_equipment(equipment_id)
        except Exception:
            logger.exception("Erreur du cycle de supervision")
        await asyncio.sleep(max(settings.monitor_interval_seconds, 10))
