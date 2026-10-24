from typing import Any, Dict, List, Optional
from backend.app.services.ward_service import WardService
from backend.app.services.department_service import DepartmentService
from backend.app.services.location_service import LocationService
from backend.app.services.complaint_service import ComplaintService
from backend.app.storage.json_store import JsonStore

class AgentToolRegistry:
    def __init__(self, json_store: JsonStore, ward_service: WardService):
        self.store = json_store
        self.ward_service = ward_service
        self.location_service = LocationService(ward_service)
        self.complaint_service = ComplaintService(json_store, ward_service)

    def resolve_location(self, area: str, landmark: Optional[str] = None, lat: Optional[float] = None, lng: Optional[float] = None) -> Dict[str, Any]:
        """Tool 2: Resolve citizen location against AMC wards."""
        return self.location_service.resolve_location(area, landmark, lat, lng)

    def lookup_ward(self, area: str) -> Dict[str, Any]:
        """Tool 3: Match normalized area to a known AMC ward."""
        return self.ward_service.lookup_by_area(area)

    def lookup_department(self, issue: str) -> Dict[str, Any]:
        """Tool 4: Map confirmed issue category to its responsible municipal department."""
        return DepartmentService.lookup_department(issue)

    def check_duplicate_complaint(self, issue: str, ward_id: str, area: str, hours_window: int = 24) -> List[Dict[str, Any]]:
        """Tool 5: Find potential duplicate complaints within the specified hours window."""
        return self.store.check_duplicates(issue, ward_id, area, hours_window)

    def create_complaint(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Tool 6: Validate and create a complaint in the mock AMC database."""
        return self.complaint_service.create_complaint(payload)

    def get_complaint_status(self, tracking_id: str) -> Dict[str, Any]:
        """Tool 7: Retrieve complaint by tracking ID from the actual saved database."""
        clean_id = (tracking_id or "").strip().upper()
        record = self.complaint_service.get_complaint(clean_id)
        if not record:
            return {
                "found": False,
                "trackingId": clean_id,
                "message": f"No complaint found matching tracking ID '{clean_id}' in demo AMC database."
            }
        return {
            "found": True,
            "trackingId": record["trackingId"],
            "status": record["status"],
            "issue": record["issue"],
            "department": record["department"],
            "ward": record["ward"],
            "wardName": record.get("wardName", ""),
            "zone": record.get("zone", ""),
            "area": record["area"],
            "landmark": record.get("landmark", ""),
            "severity": record.get("severity", ""),
            "filedAt": record["filedAt"],
            "description": record["description"],
            "statusHistory": record.get("statusHistory", [])
        }

    def list_complaints(self,
                        issue: Optional[str] = None,
                        status: Optional[str] = None,
                        severity: Optional[str] = None,
                        ward: Optional[str] = None,
                        search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tool 8: Retrieve complaint records for dashboard and administrative queries."""
        return self.complaint_service.list_complaints(issue, status, severity, ward, search)

    def update_complaint_status(self, tracking_id: str, new_status: str, note: str, admin_token: str) -> Dict[str, Any]:
        """Tool 9: Update demo complaint status with administrative authorization."""
        from backend.app.config import config
        if admin_token != config.DEMO_ADMIN_TOKEN:
            return {"success": False, "error": "Unauthorized: Invalid demo admin token."}

        try:
            updated = self.store.update_status(tracking_id, new_status, note, updated_by="AMC Operations")
            if not updated:
                return {"success": False, "error": f"Complaint '{tracking_id}' not found."}
            return {"success": True, "complaint": updated}
        except ValueError as ve:
            return {"success": False, "error": str(ve)}

    def draft_social_post(self, tracking_id: str) -> Dict[str, Any]:
        """Tool 10: Draft an editable civic awareness social media post."""
        clean_id = (tracking_id or "").strip().upper()
        record = self.complaint_service.get_complaint(clean_id)
        if not record:
            return {"success": False, "error": f"Complaint '{clean_id}' not found."}

        issue_labels = {
            "pothole": "Hazardous Pothole / Damaged Road",
            "garbage": "Waste Accumulation / Overflowing Bin",
            "streetlight": "Malfunctioning Streetlight",
            "waterlogging": "Severe Waterlogging / Blocked Drain"
        }
        issue_title = issue_labels.get(record["issue"], record["issue"].capitalize())
        area_str = record.get("area", "")
        ward_str = f"Ward {record.get('ward', '')} ({record.get('wardName', '')})"

        post_text = (
            f"📢 Civic Grievance Reported to @AmdavadAMC Demo System\n\n"
            f"📍 Location: {area_str}, {ward_str}\n"
            f"⚠️ Issue: {issue_title}\n"
            f"🏢 Department: {record.get('department')}\n"
            f"🔖 Tracking ID: #{record.get('trackingId')}\n"
            f"📊 Status: {record.get('status')}\n\n"
            f"Citizens can track resolution progress on the #CivicFlowAI dashboard. #Ahmedabad #AhmedabadCivic #SmartCityAhmedabad #CitizenVoice"
        )

        return {
            "success": True,
            "trackingId": clean_id,
            "draftText": post_text,
            "suggestedTags": ["#Ahmedabad", "#CivicFlowAI", "#AmdavadAMC", "#AhmedabadCivic", "#CitizenVoice"],
            "disclaimer": "Draft created for manual review and citizen publishing. Not automatically posted."
        }
