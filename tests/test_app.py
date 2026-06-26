import unittest

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


if __name__ == "__main__":
    unittest.main()
