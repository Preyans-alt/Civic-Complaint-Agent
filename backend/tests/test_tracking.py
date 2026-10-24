import os
import tempfile
import unittest
from backend.app.storage.json_store import JsonStore
from backend.app.services.ward_service import WardService
from backend.app.services.complaint_service import ComplaintService

SAMPLE_WARDS = [
    {"id": "W12", "name": "Navrangpura", "zone": "West", "areas": ["Navrangpura", "Stadium"]}
]

class TestTracking(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_amc.json")
        self.store = JsonStore(self.db_path)
        self.ward_svc = WardService(SAMPLE_WARDS)
        self.complaint_svc = ComplaintService(self.store, self.ward_svc)

        # Create one base complaint
        self.sample_complaint = self.complaint_svc.create_complaint({
            "userConfirmed": True,
            "issue": "pothole",
            "description": "Baseline pothole for tracking test",
            "ward": "W12",
            "area": "Navrangpura",
            "severity": "medium"
        })

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_fetch_existing_complaint(self):
        """Test 10: Fetching an existing complaint."""
        tid = self.sample_complaint["trackingId"]
        rec = self.complaint_svc.get_complaint(tid)
        self.assertIsNotNone(rec)
        self.assertEqual(rec["trackingId"], tid)
        self.assertEqual(rec["issue"], "pothole")
        self.assertEqual(rec["status"], "Submitted")

    def test_nonexistent_tracking_id(self):
        """Test 11: Handling a nonexistent tracking ID."""
        rec = self.complaint_svc.get_complaint("AMC-2026-999999")
        self.assertIsNone(rec)

    def test_status_update_and_history_preservation(self):
        """Test 12: Status updates and history preservation."""
        tid = self.sample_complaint["trackingId"]

        # Transition 1: Submitted -> Assigned
        updated1 = self.store.update_status(tid, "Assigned", "Assigned to zonal junior engineer.")
        self.assertEqual(updated1["status"], "Assigned")
        self.assertEqual(len(updated1["statusHistory"]), 2)
        self.assertEqual(updated1["statusHistory"][0]["status"], "Submitted")
        self.assertEqual(updated1["statusHistory"][1]["status"], "Assigned")

        # Transition 2: Assigned -> In Progress
        updated2 = self.store.update_status(tid, "In Progress", "Catering road crew on site.")
        self.assertEqual(updated2["status"], "In Progress")
        self.assertEqual(len(updated2["statusHistory"]), 3)

        # Transition 3: In Progress -> Resolved
        updated3 = self.store.update_status(tid, "Resolved", "Asphalt filled and compacted.")
        self.assertEqual(updated3["status"], "Resolved")
        self.assertEqual(len(updated3["statusHistory"]), 4)

        # Invalid status should fail
        with self.assertRaises(ValueError):
            self.store.update_status(tid, "MagicallyFixed", "Invalid note")

if __name__ == "__main__":
    unittest.main()
