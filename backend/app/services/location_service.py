import re
from typing import Any, Dict, Optional

class LocationService:
    def __init__(self, ward_service):
        self.ward_service = ward_service

    def resolve_location(self, area: str, landmark: Optional[str] = None, lat: Optional[float] = None, lng: Optional[float] = None) -> Dict[str, Any]:
        """
        Normalizes citizen location input, validates against AMC wards,
        and provides clear confirmation parameters.
        """
        clean_area = " ".join((area or "").strip().split())
        clean_landmark = " ".join((landmark or "").strip().split()) if landmark else ""

        if not clean_area:
            return {
                "success": False,
                "error": "Area name is required.",
                "needsConfirmation": True
            }

        ward_result = self.ward_service.lookup_by_area(clean_area)

        # If area itself didn't match, test if landmark has a recognizable area
        if not ward_result.get("matched") and clean_landmark:
            landmark_result = self.ward_service.lookup_by_area(clean_landmark)
            if landmark_result.get("matched"):
                ward_result = landmark_result
                ward_result["note"] = f"Resolved via landmark mention '{clean_landmark}'."

        coords = None
        if lat is not None and lng is not None:
            # Validate within greater Ahmedabad bounds approx (22.8 - 23.2 N, 72.4 - 72.8 E)
            if 22.8 <= lat <= 23.3 and 72.3 <= lng <= 72.8:
                coords = {"lat": round(lat, 6), "lng": round(lng, 6), "inAhmedabad": True}
            else:
                coords = {"lat": round(lat, 6), "lng": round(lng, 6), "inAhmedabad": False, "warning": "Coordinates appear outside Ahmedabad Municipal limits."}

        return {
            "success": ward_result.get("matched", False),
            "normalizedArea": clean_area,
            "landmark": clean_landmark,
            "coordinates": coords,
            "ward": ward_result.get("wardId"),
            "wardName": ward_result.get("wardName"),
            "zone": ward_result.get("zone"),
            "matchMethod": ward_result.get("matchMethod", "unmatched"),
            "ambiguous": ward_result.get("ambiguous", False),
            "candidates": ward_result.get("candidates", []),
            "suggestions": ward_result.get("suggestions", []),
            "error": ward_result.get("error")
        }
