import json
import os
import re
import tempfile
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

# IST timezone (UTC+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

def now_ist_iso() -> str:
    return datetime.now(IST).isoformat()

DEFAULT_DATABASE_STRUCTURE = {
    "wards": [
        {
            "id": "W12",
            "name": "Navrangpura",
            "zone": "West",
            "areas": ["Navrangpura", "Stadium", "CG Road", "Mithakhali", "Commerce Six Roads"]
        },
        {
            "id": "W27",
            "name": "Maninagar",
            "zone": "South",
            "areas": ["Maninagar", "Kankaria", "Jawahar Chowk", "Rambaug", "Balvatika"]
        },
        {
            "id": "W15",
            "name": "Bodakdev",
            "zone": "North West",
            "areas": ["Bodakdev", "Sindhu Bhavan", "Judges Bungalow", "Pakwan Cross Road"]
        },
        {
            "id": "W04",
            "name": "Satellite",
            "zone": "West",
            "areas": ["Satellite", "Shivranjani", "Prahlad Nagar", "Jodhpur Cross Road"]
        },
        {
            "id": "W09",
            "name": "Vastrapur",
            "zone": "West",
            "areas": ["Vastrapur", "IIM Road", "Vastrapur Lake", "Himmatlal Park"]
        },
        {
            "id": "W18",
            "name": "Paldi",
            "zone": "West",
            "areas": ["Paldi", "Anandnagar", "Fatehpura", "Bhattha", "Ellis Bridge"]
        },
        {
            "id": "W22",
            "name": "Jamalpur",
            "zone": "Central",
            "areas": ["Jamalpur", "Geeta Mandir", "Khadia", "Astodia", "Raipur"]
        },
        {
            "id": "W31",
            "name": "Sabarmati",
            "zone": "West",
            "areas": ["Sabarmati", "Dharamnagar", "RTO", "Motera", "Chandkheda"]
        }
    ],
    "departments": {
        "pothole": "Roads & Buildings",
        "garbage": "Solid Waste Management",
        "streetlight": "Light Department",
        "waterlogging": "Storm Water Drainage"
    },
    "complaints": []
}

class JsonStore:
    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self._lock = threading.Lock()
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not self.file_path.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self._write_raw(DEFAULT_DATABASE_STRUCTURE)
        else:
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if not isinstance(data, dict) or "wards" not in data or "complaints" not in data:
                    self._write_raw(DEFAULT_DATABASE_STRUCTURE)
            except Exception:
                # File corrupted, re-seed safely
                self._write_raw(DEFAULT_DATABASE_STRUCTURE)

    def _read_raw(self) -> Dict[str, Any]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_raw(self, data: Dict[str, Any]) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        dir_name = str(self.file_path.parent)
        with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, encoding="utf-8") as tf:
            json.dump(data, tf, indent=2, ensure_ascii=False)
            temp_path = tf.name
        os.replace(temp_path, self.file_path)

    def get_data(self) -> Dict[str, Any]:
        with self._lock:
            return self._read_raw()

    def get_wards(self) -> List[Dict[str, Any]]:
        with self._lock:
            data = self._read_raw()
            return data.get("wards", [])

    def get_departments(self) -> Dict[str, str]:
        with self._lock:
            data = self._read_raw()
            return data.get("departments", {})

    def get_complaints(self) -> List[Dict[str, Any]]:
        with self._lock:
            data = self._read_raw()
            return data.get("complaints", [])

    def get_complaint(self, tracking_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            data = self._read_raw()
            tid_upper = tracking_id.strip().upper()
            for c in data.get("complaints", []):
                if c.get("trackingId", "").upper() == tid_upper:
                    return c
            return None

    def _generate_tracking_id(self, existing_complaints: List[Dict[str, Any]]) -> str:
        current_year = datetime.now(IST).year
        max_num = 126
        pattern = re.compile(rf"^AMC-{current_year}-(\d+)$")
        for c in existing_complaints:
            tid = c.get("trackingId", "")
            match = pattern.match(tid)
            if match:
                val = int(match.group(1))
                if val > max_num:
                    max_num = val
        next_num = max_num + 1
        return f"AMC-{current_year}-{next_num:06d}"

    def create_complaint(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            data = self._read_raw()
            complaints = data.get("complaints", [])
            tracking_id = self._generate_tracking_id(complaints)
            now_str = now_ist_iso()

            # Find ward details
            ward_id = payload.get("ward", "")
            ward_name = payload.get("wardName", "")
            zone = payload.get("zone", "")
            if not ward_name or not zone:
                for w in data.get("wards", []):
                    if w["id"].upper() == ward_id.upper():
                        ward_name = w["name"]
                        zone = w["zone"]
                        break

            new_record = {
                "trackingId": tracking_id,
                "ward": ward_id,
                "wardName": ward_name,
                "zone": zone,
                "issue": payload.get("issue"),
                "department": payload.get("department"),
                "area": payload.get("area"),
                "landmark": payload.get("landmark", ""),
                "description": payload.get("description", ""),
                "severity": payload.get("severity", "medium").lower(),
                "status": "Submitted",
                "filedAt": now_str,
                "confidence": payload.get("confidence", 0.9),
                "evidence": payload.get("evidence", []),
                "coordinates": payload.get("coordinates"),
                "citizenName": payload.get("citizenName", "Citizen (Anonymous)"),
                "citizenContact": payload.get("citizenContact", ""),
                "imageUrl": payload.get("imageUrl"),
                "statusHistory": [
                    {
                        "status": "Submitted",
                        "timestamp": now_str,
                        "note": payload.get("filingNote", "Complaint submitted and registered in demo AMC portal.")
                    }
                ]
            }

            complaints.insert(0, new_record)
            data["complaints"] = complaints
            self._write_raw(data)
            return new_record

    def update_status(self, tracking_id: str, new_status: str, note: str, updated_by: str = "Admin") -> Optional[Dict[str, Any]]:
        with self._lock:
            data = self._read_raw()
            complaints = data.get("complaints", [])
            tid_upper = tracking_id.strip().upper()
            found_record = None

            for c in complaints:
                if c.get("trackingId", "").upper() == tid_upper:
                    found_record = c
                    break

            if not found_record:
                return None

            allowed_statuses = ["Submitted", "Assigned", "In Progress", "Resolved", "Rejected"]
            if new_status not in allowed_statuses:
                raise ValueError(f"Invalid status: {new_status}. Allowed: {allowed_statuses}")

            now_str = now_ist_iso()
            found_record["status"] = new_status
            if "statusHistory" not in found_record:
                found_record["statusHistory"] = []

            found_record["statusHistory"].append({
                "status": new_status,
                "timestamp": now_str,
                "note": f"{note.strip()} (Updated by: {updated_by})"
            })

            data["complaints"] = complaints
            self._write_raw(data)
            return found_record

    def check_duplicates(self, issue: str, ward_id: str, area: str, hours_window: int = 24) -> List[Dict[str, Any]]:
        with self._lock:
            data = self._read_raw()
            complaints = data.get("complaints", [])
            matches = []

            norm_area = area.strip().lower()
            norm_issue = issue.strip().lower()
            norm_ward = ward_id.strip().upper()

            now = datetime.now(IST)

            for c in complaints:
                c_ward = c.get("ward", "").upper()
                c_issue = c.get("issue", "").lower()
                c_area = c.get("area", "").lower()

                # Check category similarity
                if c_issue != norm_issue:
                    continue

                # Check ward or area proximity
                ward_match = (c_ward == norm_ward)
                area_match = (norm_area in c_area or c_area in norm_area) if norm_area and c_area else False

                if ward_match or area_match:
                    # Check timestamp window if available
                    time_diff_hours = 0
                    filed_at = c.get("filedAt")
                    if filed_at:
                        try:
                            # Handle standard ISO format
                            dt = datetime.fromisoformat(filed_at)
                            if dt.tzinfo is None:
                                dt = dt.replace(tzinfo=IST)
                            diff = now - dt
                            time_diff_hours = diff.total_seconds() / 3600.0
                        except Exception:
                            time_diff_hours = 0

                    if time_diff_hours <= hours_window:
                        matches.append({
                            "trackingId": c.get("trackingId"),
                            "issue": c.get("issue"),
                            "area": c.get("area"),
                            "ward": c.get("ward"),
                            "department": c.get("department"),
                            "severity": c.get("severity"),
                            "status": c.get("status"),
                            "filedAt": c.get("filedAt"),
                            "matchReason": f"Matching issue '{issue}' in same ward ({c_ward}) and area within {int(time_diff_hours)} hours."
                        })

            return matches
