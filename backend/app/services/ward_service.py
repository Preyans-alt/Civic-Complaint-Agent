import re
from typing import Any, Dict, List, Optional

class WardService:
    def __init__(self, wards_data: List[Dict[str, Any]]):
        self.wards = wards_data

    @staticmethod
    def _normalize(text: str) -> str:
        if not text:
            return ""
        # Remove special characters, collapse spaces, lowercase
        cleaned = re.sub(r"[^\w\s]", " ", text)
        return " ".join(cleaned.lower().split())

    def lookup_by_area(self, area_input: str) -> Dict[str, Any]:
        """
        Matches an area name to an authoritative AMC ward.
        Exact match first, then substring/token match.
        Never fabricates or silently assigns a ward.
        """
        norm_input = self._normalize(area_input)
        if not norm_input:
            return {
                "matched": False,
                "error": "Area name cannot be empty.",
                "suggestions": self.get_all_area_suggestions()[:6]
            }

        # 1. Exact match on ward name or any listed area
        for ward in self.wards:
            if self._normalize(ward.get("name", "")) == norm_input:
                return {
                    "matched": True,
                    "wardId": ward["id"],
                    "wardName": ward["name"],
                    "zone": ward["zone"],
                    "matchedArea": ward["name"],
                    "confidence": 1.0,
                    "matchMethod": "exact_ward_name"
                }
            for area in ward.get("areas", []):
                if self._normalize(area) == norm_input:
                    return {
                        "matched": True,
                        "wardId": ward["id"],
                        "wardName": ward["name"],
                        "zone": ward["zone"],
                        "matchedArea": area,
                        "confidence": 1.0,
                        "matchMethod": "exact_area_match"
                    }

        # 2. Substring matching (token or phrase)
        candidates = []
        for ward in self.wards:
            for area in ward.get("areas", []):
                norm_area = self._normalize(area)
                if norm_input in norm_area or norm_area in norm_input:
                    candidates.append({
                        "wardId": ward["id"],
                        "wardName": ward["name"],
                        "zone": ward["zone"],
                        "matchedArea": area,
                        "confidence": 0.85
                    })

        if len(candidates) == 1:
            res = candidates[0]
            res["matched"] = True
            res["matchMethod"] = "partial_match"
            return res
        elif len(candidates) > 1:
            # Ambiguous match - ask user to clarify between candidates
            return {
                "matched": False,
                "ambiguous": True,
                "error": f"Multiple potential wards matched '{area_input}'. Please specify exact area.",
                "candidates": candidates
            }

        # 3. No match found - suggest known areas
        return {
            "matched": False,
            "error": f"Area '{area_input}' not found in Ahmedabad demo ward directory.",
            "suggestions": self.get_all_area_suggestions()[:8]
        }

    def get_ward_by_id(self, ward_id: str) -> Optional[Dict[str, Any]]:
        norm_id = ward_id.strip().upper()
        for w in self.wards:
            if w.get("id", "").upper() == norm_id:
                return w
        return None

    def get_all_area_suggestions(self) -> List[str]:
        suggestions = []
        for w in self.wards:
            for a in w.get("areas", []):
                if a not in suggestions:
                    suggestions.append(a)
        return sorted(suggestions)
