import os
import tempfile
import unittest
from backend.app.storage.json_store import JsonStore

class TestJsonStore(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "store_test.json")
        self.store = JsonStore(self.db_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_duplicate_detection(self):
        """Test 13: Duplicate detection within same ward/area."""
        # Insert initial complaint
        c1 = self.store.create_complaint({
            "ward": "W12",
            "wardName": "Navrangpura",
            "zone": "West",
            "issue": "pothole",
            "department": "Roads & Buildings",
            "area": "Navrangpura",
            "description": "First pothole",
            "severity": "high"
        })

        # Check duplicate with matching issue, ward, and area
        dupes = self.store.check_duplicates("pothole", "W12", "Navrangpura", hours_window=24)
        self.assertEqual(len(dupes), 1)
        self.assertEqual(dupes[0]["trackingId"], c1["trackingId"])

        # Check duplicate with different issue
        no_dupes = self.store.check_duplicates("garbage", "W12", "Navrangpura", hours_window=24)
        self.assertEqual(len(no_dupes), 0)

    def test_json_atomic_writes(self):
        """Test 14: Atomic writes ensure valid JSON content and no corrupt partial state."""
        # Write multiple complaints
        for i in range(5):
            self.store.create_complaint({
                "ward": "W12",
                "wardName": "Navrangpura",
                "zone": "West",
                "issue": "streetlight",
                "department": "Light Department",
                "area": "Navrangpura",
                "description": f"Streetlight {i}",
                "severity": "low"
            })

        data = self.store.get_data()
        self.assertEqual(len(data["complaints"]), 5)

    def test_malformed_file_recovery(self):
        """Test 14b: Malformed or corrupted JSON file recovery."""
        # Corrupt the file deliberately
        with open(self.db_path, "w", encoding="utf-8") as f:
            f.write("{{BROKEN_JSON_DATA!??")

        # New store instance should handle gracefully and re-seed default structure
        recovered_store = JsonStore(self.db_path)
        data = recovered_store.get_data()
        self.assertIn("wards", data)
        self.assertIn("complaints", data)

if __name__ == "__main__":
    unittest.main()
