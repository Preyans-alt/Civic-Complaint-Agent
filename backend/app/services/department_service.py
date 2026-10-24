from typing import Any, Dict, Optional

class DepartmentService:
    DEPARTMENT_MAPPING = {
        "pothole": "Roads & Buildings",
        "garbage": "Solid Waste Management",
        "streetlight": "Light Department",
        "waterlogging": "Storm Water Drainage"
    }

    @classmethod
    def lookup_department(cls, issue_type: str) -> Dict[str, Any]:
        norm_issue = (issue_type or "").strip().lower()
        dept = cls.DEPARTMENT_MAPPING.get(norm_issue)
        if dept:
            return {
                "valid": True,
                "issue": norm_issue,
                "department": dept,
                "source": "AMC Citizen Charter 2026",
                "requiresManualReview": False
            }
        elif norm_issue in ("other", "unclear"):
            return {
                "valid": False,
                "issue": norm_issue,
                "department": "Citizen Grievance Redressal Cell",
                "source": "Manual Routing Queue",
                "requiresManualReview": True,
                "message": "Issue type requires citizen verification or manual officer triage."
            }
        else:
            return {
                "valid": False,
                "issue": norm_issue,
                "department": None,
                "requiresManualReview": True,
                "error": f"Unknown civic issue type '{issue_type}'. Must be one of: {list(cls.DEPARTMENT_MAPPING.keys())}."
            }
