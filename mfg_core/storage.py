"""
Local file-backed storage for access requests + access log (backlog #17).

GxP's equivalent (mbr_core/storage.py) uses Azure Table Storage against the
already-provisioned saamplifyiq account. MFG has no Table/Blob Storage
plumbed in at all — its existing small-record persistence (chat_logs/,
health_logs/ in main.py) is local JSON/JSONL files instead, so this follows
that same convention rather than introducing a new storage account
dependency for two lightweight record types.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path("access_data")
ACCESS_REQUESTS_FILE = DATA_DIR / "access_requests.json"
ACCESS_LOG_FILE = DATA_DIR / "access_log.jsonl"


def _ensure_dir() -> None:
    DATA_DIR.mkdir(exist_ok=True)


def _load_access_requests() -> dict[str, dict[str, Any]]:
    _ensure_dir()
    if not ACCESS_REQUESTS_FILE.exists():
        return {}
    with open(ACCESS_REQUESTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_access_requests(requests: dict[str, dict[str, Any]]) -> None:
    _ensure_dir()
    with open(ACCESS_REQUESTS_FILE, "w", encoding="utf-8") as f:
        json.dump(requests, f, indent=2)


def save_access_request(name: str, email: str, company: str, reason: str) -> dict[str, Any]:
    request_id = str(uuid.uuid4())
    entity = {
        "id": request_id,
        "name": name,
        "email": email,
        "company": company or "",
        "reason": reason or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "decided_at": "",
    }
    requests = _load_access_requests()
    requests[request_id] = entity
    _save_access_requests(requests)
    return entity


def list_access_requests() -> list[dict[str, Any]]:
    requests = list(_load_access_requests().values())
    requests.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    return requests


def update_access_request_status(request_id: str, status: str) -> dict[str, Any] | None:
    requests = _load_access_requests()
    entity = requests.get(request_id)
    if not entity:
        return None
    entity["status"] = status
    entity["decided_at"] = datetime.now(timezone.utc).isoformat()
    requests[request_id] = entity
    _save_access_requests(requests)
    return entity


def save_access_log_entry(ip: str, user_agent: str) -> None:
    """One line per successful splash-PIN unlock. No identity is captured
    (the PIN itself carries none), just IP/UA/time."""
    _ensure_dir()
    entry = {
        "ip": ip,
        "user_agent": user_agent,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(ACCESS_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def list_access_log(limit: int = 100) -> list[dict[str, Any]]:
    _ensure_dir()
    if not ACCESS_LOG_FILE.exists():
        return []
    entries = []
    with open(ACCESS_LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                entries.append(json.loads(line))
    entries.sort(key=lambda e: e.get("created_at") or "", reverse=True)
    return entries[:limit]
