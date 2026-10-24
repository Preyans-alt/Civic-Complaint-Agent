import unittest
from backend.app.services.ward_service import WardService

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
        "areas": ["Maninagar", "Kankaria", "Jawahar Chowk"]
    },
    {
        "id": "W15",
        "name": "Bodakdev",
        "zone": "North West",
        "areas": ["Bodakdev", "Sindhu Bhavan", "Judges Bungalow"]
    }
]

class TestWardService(unittest.TestCase):
    def setUp(self):
        self.ward_service = WardService(SAMPLE_WARDS)

    def test_exact_ward_match_navrangpura(self):
        """Test 1: Exact ward match for Navrangpura."""
        res = self.ward_service.lookup_by_area("Navrangpura")
        self.assertTrue(res["matched"])
        self.assertEqual(res["wardId"], "W12")
        self.assertEqual(res["zone"], "West")
        self.assertEqual(res["wardName"], "Navrangpura")

    def test_exact_ward_match_kankaria(self):
        """Test 2: Exact ward match for Kankaria."""
        res = self.ward_service.lookup_by_area("Kankaria")
        self.assertTrue(res["matched"])
        self.assertEqual(res["wardId"], "W27")
        self.assertEqual(res["zone"], "South")
        self.assertEqual(res["wardName"], "Maninagar")

    def test_unknown_area_handling(self):
        """Test 3: Unknown area handling."""
        res = self.ward_service.lookup_by_area("RandomUnknownColony")
        self.assertFalse(res["matched"])
        self.assertIn("error", res)
        self.assertIn("suggestions", res)
        self.assertGreater(len(res["suggestions"]), 0)

    def test_ambiguous_location_handling(self):
        """Test 4: Ambiguous location handling when multiple areas match."""
        # Add another area containing 'Road' to create ambiguity
        ambiguous_wards = [
            {"id": "W12", "name": "Navrangpura", "zone": "West", "areas": ["CG Road", "Stadium Road"]},
            {"id": "W04", "name": "Satellite", "zone": "West", "areas": ["Ring Road"]}
        ]
        svc = WardService(ambiguous_wards)
        res = svc.lookup_by_area("Road")
        self.assertFalse(res["matched"])
        self.assertTrue(res.get("ambiguous", False))
        self.assertGreater(len(res["candidates"]), 1)

if __name__ == "__main__":
    unittest.main()
