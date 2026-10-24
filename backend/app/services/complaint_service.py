from typing import Any, Dict, List, Optional
from backend.app.services.ward_service import WardService
from backend.app.services.department_service import DepartmentService

class ComplaintService:
    def __init__(self, json_store, ward_service: WardService):
        self.store = json_store
        self.ward_service = ward_service

    def create_complaint(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enforces all 10 core business rules before recording in the database.
        """
        # Rule 4: User confirmation required
        if not payload.get("userConfirmed"):
            raise ValueError("Citizen confirmation is required before filing a formal complaint.")

        # Rule 1: Validate required fields
        issue = (payload.get("issue") or "").strip().lower()
        if not issue:
            raise ValueError("Issue category is required.")

        description = (payload.get("description") or "").strip()
        if not description:
            raise ValueError("Complaint description is required.")

        ward_id = (payload.get("ward") or "").strip().upper()
        if not ward_id:
            raise ValueError("Ward ID is required.")

        area = (payload.get("area") or "").strip()
        if not area:
            raise ValueError("Area name is required.")

        # Rule 2: Verify ward exists in authoritative store
        ward_info = self.ward_service.get_ward_by_id(ward_id)
        if not ward_info:
            raise ValueError(f"Ward ID '{ward_id}' is invalid or unknown to AMC.")

        # Rule 3: Verify issue category maps to department
        dept_lookup = DepartmentService.lookup_department(issue)
        if not dept_lookup["valid"]:
            raise ValueError(dept_lookup.get("error", f"Invalid issue category '{issue}'."))

        department = dept_lookup["department"]

        # Validate severity
        severity = (payload.get("severity") or "medium").strip().lower()
        if severity not in ("low", "medium", "high", "critical"):
            severity = "medium"

        # Rules 5-10: Handled atomically by json_store
        clean_record = {
            "ward": ward_info["id"],
            "wardName": ward_info["name"],
            "zone": ward_info["zone"],
            "issue": issue,
            "department": department,
            "area": area,
            "landmark": (payload.get("landmark") or "").strip(),
            "description": description,
            "severity": severity,
            "confidence": float(payload.get("confidence", 0.9)),
            "evidence": payload.get("evidence", []),
            "coordinates": payload.get("coordinates"),
            "citizenName": (payload.get("citizenName") or "").strip() or "Citizen (Demo)",
            "citizenContact": (payload.get("citizenContact") or "").strip(),
            "imageUrl": payload.get("imageUrl"),
            "filingNote": "Complaint officially logged into demo AMC system via CivicFlow AI."
        }

        return self.store.create_complaint(clean_record)

    def get_complaint(self, tracking_id: str) -> Optional[Dict[str, Any]]:
        return self.store.get_complaint(tracking_id)

    def list_complaints(self,
                        issue: Optional[str] = None,
                        status: Optional[str] = None,
                        severity: Optional[str] = None,
                        ward: Optional[str] = None,
                        search: Optional[str] = None) -> List[Dict[str, Any]]:
        all_records = self.store.get_complaints()
        filtered = []

        q = (search or "").strip().lower()

        for c in all_records:
            if issue and c.get("issue", "").lower() != issue.lower():
                continue
            if status and c.get("status", "").lower() != status.lower():
                continue
            if severity and c.get("severity", "").lower() != severity.lower():
                continue
            if ward and c.get("ward", "").upper() != ward.upper():
                continue
            if q:
                tid = c.get("trackingId", "").lower()
                c_area = c.get("area", "").lower()
                c_desc = c.get("description", "").lower()
                c_landmark = c.get("landmark", "").lower()
                if q not in tid and q not in c_area and q not in c_desc and q not in c_landmark:
                    continue
            filtered.append(c)

        return filtered
