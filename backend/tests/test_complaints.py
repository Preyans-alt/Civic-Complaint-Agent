import os
import tempfile
import unittest
from backend.app.storage.json_store import JsonStore
from backend.app.services.ward_service import WardService
from backend.app.services.department_service import DepartmentService
from backend.app.services.complaint_service import ComplaintService

SAMPLE_WARDS = [
    {
        "id": "W12",
        "name": "Navrangpura",
        "zone": "West",
        "areas": ["Navrangpura", "Stadium", "CG Road"]
    },
    {
        "id": "W27",
        "name": "Maninagar",
        "zone": "South",
        "areas": ["Maninagar", "Kankaria"]
    }
]

class TestComplaintService(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_amc.json")
        self.store = JsonStore(self.db_path)
        self.ward_svc = WardService(SAMPLE_WARDS)
        self.complaint_svc = ComplaintService(self.store, self.ward_svc)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_valid_department_lookup(self):
        """Test 5: Valid department lookup."""
        pothole_res = DepartmentService.lookup_department("pothole")
        self.assertTrue(pothole_res["valid"])
        self.assertEqual(pothole_res["department"], "Roads & Buildings")

        garbage_res = DepartmentService.lookup_department("garbage")
        self.assertTrue(garbage_res["valid"])
        self.assertEqual(garbage_res["department"], "Solid Waste Management")

        streetlight_res = DepartmentService.lookup_department("streetlight")
        self.assertTrue(streetlight_res["valid"])
        self.assertEqual(streetlight_res["department"], "Light Department")

        waterlogging_res = DepartmentService.lookup_department("waterlogging")
        self.assertTrue(waterlogging_res["valid"])
        self.assertEqual(waterlogging_res["department"], "Storm Water Drainage")

    def test_invalid_issue_category_rejection(self):
        """Test 6: Invalid issue category rejection."""
        invalid_res = DepartmentService.lookup_department("alien_invasion")
        self.assertFalse(invalid_res["valid"])
        self.assertIn("error", invalid_res)

        # Ensure complaint service rejects it
        payload = {
            "userConfirmed": True,
            "issue": "alien_invasion",
            "description": "Strange object on road",
            "ward": "W12",
            "area": "Navrangpura"
        }
        with self.assertRaises(ValueError):
            self.complaint_svc.create_complaint(payload)

    def test_complaint_creation_valid_ward(self):
        """Test 7: Complaint creation with a valid ward."""
        payload = {
            "userConfirmed": True,
            "issue": "pothole",
            "description": "Deep dangerous pothole near Stadium circle",
            "ward": "W12",
            "area": "Stadium",
            "severity": "high",
            "citizenName": "Aarav Shah"
        }
        res = self.complaint_svc.create_complaint(payload)
        self.assertTrue(res["trackingId"].startswith("AMC-"))
        self.assertEqual(res["ward"], "W12")
        self.assertEqual(res["department"], "Roads & Buildings")
        self.assertEqual(res["status"], "Submitted")
        self.assertEqual(len(res["statusHistory"]), 1)

    def test_complaint_creation_invalid_ward(self):
        """Test 8: Complaint creation with an invalid ward."""
        payload = {
            "userConfirmed": True,
            "issue": "pothole",
            "description": "Pothole somewhere",
            "ward": "W999",
            "area": "Nowhere"
        }
        with self.assertRaises(ValueError) as ctx:
            self.complaint_svc.create_complaint(payload)
        self.assertIn("Ward ID 'W999' is invalid", str(ctx.exception))

    def test_unique_tracking_id_generation(self):
        """Test 9: Unique sequential tracking ID generation."""
        p1 = {
            "userConfirmed": True,
            "issue": "pothole",
            "description": "Pothole 1",
            "ward": "W12",
            "area": "CG Road"
        }
        p2 = {
            "userConfirmed": True,
            "issue": "garbage",
            "description": "Garbage pile 2",
            "ward": "W27",
            "area": "Maninagar"
        }
        c1 = self.complaint_svc.create_complaint(p1)
        c2 = self.complaint_svc.create_complaint(p2)
        self.assertNotEqual(c1["trackingId"], c2["trackingId"])
        # Format check AMC-YYYY-NNNNNN
        self.assertRegex(c1["trackingId"], r"^AMC-\d{4}-\d{6}$")
        self.assertRegex(c2["trackingId"], r"^AMC-\d{4}-\d{6}$")

if __name__ == "__main__":
    unittest.main()
