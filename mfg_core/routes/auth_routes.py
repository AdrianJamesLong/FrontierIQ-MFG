"""
PIN/access-control gate + Admin Permissions routes (backlog #17, parity with
FrontierIQ-GxP's version, which is the richer of the two siblings — it adds
an Access Log on top of Energy's simpler request/approve/deny flow).

POST /auth/verify-pin        {"pin"}  splash-screen deterrent, not real auth
GET  /access-log             ?admin_pin=  every successful splash-PIN unlock (IP/UA/time)
POST /auth/verify-admin-pin  {"pin"}  gates the Admin Permissions page separately from the app PIN
POST /access-requests              {"name","email","company","reason"} -> stores pending
GET  /access-requests?admin_pin=   list all access requests (admin-pin gated)
PUT  /access-requests/{id}/approve {"admin_pin"} -> marks approved
PUT  /access-requests/{id}/deny    {"admin_pin"} -> marks denied

No email notifications (GxP emails the requester/approver via Microsoft
Graph) — MFG has no Azure AD app credentials configured for this, and it
isn't required for the gate itself to work; approved requesters are told
the PIN out of band, same as before this backlog item existed.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from storage import (
    save_access_request, list_access_requests, update_access_request_status,
    save_access_log_entry, list_access_log,
)
from shared.config import get_settings

router = APIRouter(tags=["access-control"])


class PinRequest(BaseModel):
    pin: str


@router.post("/auth/verify-pin")
def verify_pin_route(req: PinRequest, request: Request):
    """Checked server-side so the real PIN never ships in the frontend
    build, but this is still a single shared secret with no session/token,
    no rate limiting, no lockout — a deterrent, not real auth. Logs every
    successful unlock (IP/user-agent/time) for the Admin Permissions page's
    Access Log. X-Forwarded-For first since Container Apps sits behind
    ingress; request.client.host would otherwise just be the proxy's
    address."""
    settings = get_settings()
    ok = req.pin == settings.splash_pin
    if ok:
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
            request.client.host if request.client else "unknown"
        )
        save_access_log_entry(ip, request.headers.get("user-agent", ""))
    return {"ok": ok}


@router.get("/access-log")
def list_access_log_route(admin_pin: str = ""):
    settings = get_settings()
    if admin_pin != settings.admin_pin:
        raise HTTPException(status_code=403, detail="Invalid admin PIN")
    return {"entries": list_access_log()}


@router.post("/auth/verify-admin-pin")
def verify_admin_pin_route(req: PinRequest):
    """Separate secret from splash_pin so approving/denying access requests
    isn't gated by the same PIN handed out to every demo user."""
    settings = get_settings()
    return {"ok": req.pin == settings.admin_pin}


class AccessRequestCreate(BaseModel):
    name: str
    email: str
    company: str = ""
    reason: str = ""


@router.post("/access-requests")
def create_access_request(req: AccessRequestCreate):
    entity = save_access_request(req.name, req.email, req.company, req.reason)
    return {"ok": True, "id": entity["id"]}


@router.get("/access-requests")
def list_access_requests_route(admin_pin: str = ""):
    settings = get_settings()
    if admin_pin != settings.admin_pin:
        raise HTTPException(status_code=403, detail="Invalid admin PIN")
    return {"requests": list_access_requests()}


class AccessRequestDecision(BaseModel):
    admin_pin: str


@router.put("/access-requests/{request_id}/approve")
def approve_access_request(request_id: str, req: AccessRequestDecision):
    settings = get_settings()
    if req.admin_pin != settings.admin_pin:
        raise HTTPException(status_code=403, detail="Invalid admin PIN")
    entity = update_access_request_status(request_id, "approved")
    if not entity:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"ok": True}


@router.put("/access-requests/{request_id}/deny")
def deny_access_request(request_id: str, req: AccessRequestDecision):
    settings = get_settings()
    if req.admin_pin != settings.admin_pin:
        raise HTTPException(status_code=403, detail="Invalid admin PIN")
    entity = update_access_request_status(request_id, "denied")
    if not entity:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"ok": True}
