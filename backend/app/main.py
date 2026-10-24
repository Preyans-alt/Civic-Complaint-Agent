"""
CivicFlow AI — Intelligent Civic Complaint Assistant for Ahmedabad Municipal Corporation (Demo)
FastAPI Backend Application
"""
import os
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.app.config import config
from backend.app.storage.json_store import JsonStore
from backend.app.services.ward_service import WardService
from backend.app.services.department_service import DepartmentService
from backend.app.services.location_service import LocationService
from backend.app.services.complaint_service import ComplaintService
from backend.app.tools.registry import AgentToolRegistry

app = FastAPI(
    title="CivicFlow AI — Ahmedabad Civic Complaint API",
    description="Official demo REST API for civic issue reporting, automated multimodal triage, ward routing, and complaint tracking for Ahmedabad.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize storage and services
store = JsonStore(config.DATA_FILE)
ward_service = WardService(store.get_wards())
location_service = LocationService(ward_service)
complaint_service = ComplaintService(store, ward_service)
tool_registry = AgentToolRegistry(store, ward_service)

# Schemas
class ResolveLocationRequest(BaseModel):
    area: str
    landmark: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class CheckDuplicateRequest(BaseModel):
    issue: str
    ward: str
    area: str
    hours_window: Optional[int] = 24

class CreateComplaintRequest(BaseModel):
    userConfirmed: bool = Field(..., description="Citizen explicit confirmation")
    issue: str
    description: str
    ward: str
    area: str
    landmark: Optional[str] = ""
    severity: Optional[str] = "medium"
    confidence: Optional[float] = 0.90
    evidence: Optional[List[str]] = []
    coordinates: Optional[dict] = None
    citizenName: Optional[str] = "Citizen (Demo)"
    citizenContact: Optional[str] = ""
    imageUrl: Optional[str] = None

class AdminStatusUpdateRequest(BaseModel):
    status: str
    note: str

class AgentChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CivicFlow AI Backend",
        "city": "Ahmedabad",
        "model": config.GEMINI_MODEL,
        "environment": "Demo/Hackathon MVP",
        "disclaimer": "This is a demonstration system, not an official AMC portal."
    }

@app.get("/api/wards")
def get_wards():
    return {"wards": store.get_wards()}

@app.get("/api/departments")
def get_departments():
    return {"departments": store.get_departments()}

@app.post("/api/resolve-location")
def resolve_location(req: ResolveLocationRequest):
    result = tool_registry.resolve_location(req.area, req.landmark, req.lat, req.lng)
    return result

@app.post("/api/check-duplicate")
def check_duplicate(req: CheckDuplicateRequest):
    candidates = tool_registry.check_duplicate_complaint(req.issue, req.ward, req.area, req.hours_window)
    return {
        "hasDuplicates": len(candidates) > 0,
        "count": len(candidates),
        "candidates": candidates
    }

@app.post("/api/complaints")
def create_complaint(req: CreateComplaintRequest):
    try:
        record = tool_registry.create_complaint(req.dict())
        return {
            "success": True,
            "message": "Complaint successfully registered in demo AMC database.",
            "complaint": record
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record complaint: {str(e)}")

@app.get("/api/complaints")
def list_complaints(
    issue: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    ward: Optional[str] = None,
    search: Optional[str] = None
):
    complaints = tool_registry.list_complaints(issue, status, severity, ward, search)
    return {
        "total": len(complaints),
        "complaints": complaints
    }

@app.get("/api/complaints/{tracking_id}")
def get_complaint(tracking_id: str):
    res = tool_registry.get_complaint_status(tracking_id)
    if not res.get("found"):
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@app.get("/api/complaints/{tracking_id}/status")
def get_complaint_status(tracking_id: str):
    res = tool_registry.get_complaint_status(tracking_id)
    if not res.get("found"):
        raise HTTPException(status_code=404, detail=res["message"])
    return {
        "trackingId": res["trackingId"],
        "status": res["status"],
        "issue": res["issue"],
        "department": res["department"],
        "ward": res["ward"],
        "filedAt": res["filedAt"],
        "statusHistory": res["statusHistory"]
    }

@app.post("/api/admin/complaints/{tracking_id}/status")
def update_complaint_status(
    tracking_id: str,
    req: AdminStatusUpdateRequest,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")
):
    token = x_admin_token or ""
    res = tool_registry.update_complaint_status(tracking_id, req.status, req.note, token)
    if not res.get("success"):
        raise HTTPException(status_code=403 if "Unauthorized" in res.get("error", "") else 400, detail=res.get("error"))
    return res

@app.post("/api/complaints/{tracking_id}/social-draft")
def get_social_draft(tracking_id: str):
    res = tool_registry.draft_social_post(tracking_id)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("error"))
    return res
