import unittest
from unittest.mock import patch

from app import (
    DLC_OPTIONS,
    SCENARIO,
    build_options,
    generate_start_parameters,
    get_active_dlcs,
    app
)


class RandomizerTests(unittest.TestCase):
    def test_unknown_dlcs_are_ignored(self):
        self.assertEqual(get_active_dlcs(["biotech", "unknown"]), ["biotech"])

    def test_vanilla_options_are_available_without_dlcs(self):
        options = build_options([])

        self.assertEqual(options["scenarios"], SCENARIO)

    def test_biotech_adds_biotech_scenarios(self):
        options = build_options(["biotech"])

        self.assertIn("Mechanitor", options["scenarios"])
        self.assertIn("Sanguophage", options["scenarios"])

    def test_generated_parameters_include_dlc_settings(self):
        parameters = generate_start_parameters(["ideology", "biotech"])

        self.assertIn("Ideoligion", parameters["dlc_settings"])
        self.assertIn("Starting xenotype", parameters["dlc_settings"])

    def test_index_renders_available_dlc_names(self):
        with app.test_client() as client:
            response = client.get("/")

        self.assertEqual(response.status_code, 200)
        for dlc in DLC_OPTIONS.values():
            self.assertIn(dlc["name"].encode(), response.data)

    def test_index_keeps_selected_dlc_checked(self):
        with app.test_client() as client:
            response = client.get("/?dlc=biotech")

        self.assertEqual(response.status_code, 200)
        html = response.data.decode()

        self.assertIn('value="biotech"', html)
        self.assertIn("checked", html)

    def test_json_readout_matches_full_page(self):
        parameters = generate_start_parameters(["royalty", "biotech"])
        with patch("app.generate_start_parameters", return_value=parameters):
            with app.test_client() as client:
                page = client.get("/?dlc=royalty&dlc=biotech")
                response = client.get("/?dlc=royalty&dlc=biotech", headers={"Accept": "application/json"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
        readout = response.get_json()["readout"].strip()
        self.assertIn(readout, page.get_data(as_text=True))
        self.assertEqual(readout.count('class="parameter"'), 8)
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertIn("Accept", response.vary)

    def test_json_readout_filters_unknown_dlcs(self):
        with app.test_client() as client:
            response = client.get("/?dlc=unknown&dlc=anomaly", headers={"Accept": "application/json"})

        readout = response.get_json()["readout"]
        self.assertEqual(readout.count('class="parameter"'), 7)
        self.assertIn("Anomaly content", readout)
        self.assertNotIn("Royalty focus", readout)

    def test_normal_navigation_still_returns_html(self):
        with app.test_client() as client:
            response = client.get("/", headers={"Accept": "*/*"})

        self.assertEqual(response.mimetype, "text/html")
        self.assertIn(b'<form method="get"', response.data)
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_lifecycle_endpoint_accepts_browser_signals(self):
        with app.test_client() as client:
            for action in ("connect", "heartbeat", "disconnect"):
                response = client.post("/lifecycle", json={"action": action, "id": "test-tab"})
                self.assertEqual(response.status_code, 204)

    def test_seed_is_copyable_and_landing_roll_label_is_clear(self):
        with app.test_client() as client:
            response = client.get("/")

        html = response.get_data(as_text=True)
        self.assertIn('class="copy-seed"', html)
        self.assertIn('aria-label="Copy seed"', html)
        self.assertIn("Landing Site Rolls", html)
        self.assertNotIn("Map Clicks", html)


if __name__ == "__main__":
    unittest.main()
