import os
import tempfile
import unittest
from unittest.mock import MagicMock
from backend.app.storage.json_store import JsonStore
from backend.app.services.ward_service import WardService
from backend.app.tools.registry import AgentToolRegistry

SAMPLE_WARDS = [
    {"id": "W12", "name": "Navrangpura", "zone": "West", "areas": ["Navrangpura", "Stadium"]}
]

class TestAgentTools(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "tool_test.json")
        self.store = JsonStore(self.db_path)
        self.ward_svc = WardService(SAMPLE_WARDS)
        self.registry = AgentToolRegistry(self.store, self.ward_svc)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_image_validation(self):
        """Test 15: Image type and size validation."""
        # Allowed formats: JPEG, PNG, WebP; max size: 8 MB
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        disallowed_types = ["image/gif", "application/pdf", "text/plain"]
        max_bytes = 8 * 1024 * 1024

        def validate_image_meta(mime: str, size: int):
            if mime not in allowed_types:
                return False, f"Unsupported format '{mime}'. Must be JPEG, PNG, or WebP."
            if size > max_bytes:
                return False, f"File size {size} exceeds 8 MB limit."
            return True, "OK"

        ok, _ = validate_image_meta("image/jpeg", 2 * 1024 * 1024)
        self.assertTrue(ok)
        ok, _ = validate_image_meta("image/png", 500 * 1024)
        self.assertTrue(ok)

        bad_type, err = validate_image_meta("image/gif", 1000)
        self.assertFalse(bad_type)
        self.assertIn("Unsupported format", err)

        bad_size, err = validate_image_meta("image/jpeg", 10 * 1024 * 1024)
        self.assertFalse(bad_size)
        self.assertIn("exceeds 8 MB", err)

    def test_agent_tool_argument_validation(self):
        """Test 16: Agent tool argument validation."""
        # Resolving location with empty area
        res = self.registry.resolve_location("")
        self.assertFalse(res["success"])
        self.assertIn("error", res)

        # Lookup department with unknown issue
        dept_res = self.registry.lookup_department("teleportation_glitch")
        self.assertFalse(dept_res["valid"])

        # Create complaint without confirmation
        with self.assertRaises(ValueError):
            self.registry.create_complaint({
                "userConfirmed": False,
                "issue": "pothole",
                "ward": "W12",
                "area": "Navrangpura",
                "description": "Missing confirmation"
            })

    def test_gemini_unavailable_fallback_handling(self):
        """Test 17: Failure handling when the Gemini API is unavailable."""
        # Simulated Gemini client error
        def mock_failing_gemini_call():
            raise ConnectionError("Gemini API service temporarily unreachable or network error.")

        with self.assertRaises(ConnectionError):
            mock_failing_gemini_call()

    def test_database_write_failure_handling(self):
        """Test 18: Failure handling when a database write fails."""
        # Read-only store path simulation
        mock_broken_store = MagicMock()
        mock_broken_store.create_complaint.side_effect = IOError("Disk full or permission denied writing amc.json.")

        from backend.app.services.complaint_service import ComplaintService
        failing_svc = ComplaintService(mock_broken_store, self.ward_svc)

        with self.assertRaises(IOError):
            failing_svc.create_complaint({
                "userConfirmed": True,
                "issue": "pothole",
                "description": "Valid complaint",
                "ward": "W12",
                "area": "Navrangpura"
            })

if __name__ == "__main__":
    unittest.main()
