from flask import Flask, render_template, request
import random
import string
import threading
import webbrowser
import sys
import os


#--------------------------------------------------------------------------------------------
# Resource Path Helper for PyInstaller
#--------------------------------------------------------------------------------------------

def resource_path(relative_path):
    """
    Get the correct resource path for development and PyInstaller .exe builds
    """
    base_path = getattr(sys, "_MEIPASS", os.path.abspath("."))

    return os.path.join(base_path, relative_path)


#--------------------------------------------------------------------------------------------
# Flask App Setup
#--------------------------------------------------------------------------------------------

app = Flask(
    __name__,
    template_folder=resource_path("templates")
)


#--------------------------------------------------------------------------------------------
# Rimworld Vanilla Options
#--------------------------------------------------------------------------------------------

SCENARIO = [
    "Crashlanded",
    "Lost Tribe",
    "Rich Explorer",
    "Naked Brutality"
]

STORYTELLER = [
    "Cassandra Classic",
    "Phoebe Chillax",
    "Randy Random"
]

DIFFICULTIES = [
    "Peaceful",
    "Community Builder",
    "Adventure Story",
    "Strive to Survive",
    "Blood and Dust",
    "Losing is Fun"
]

DLC_OPTIONS = {
    "royalty": {
        "name": "Royalty",
        "settings": {
            "Royalty focus": [
                "Ignore noble titles",
                "Earn noble titles",
                "Trade with the Empire"
            ]
        }
    },
    "ideology": {
        "name": "Ideology",
        "settings": {
            "Ideoligion": [
                "Classic-like",
                "Fixed ideoligion",
                "Fluid ideoligion"
            ]
        }
    },
    "biotech": {
        "name": "Biotech",
        "scenarios": [
            "Mechanitor",
            "Sanguophage"
        ],
        "settings": {
            "Starting xenotype": [
                "Baseliner",
                "Dirtmole",
                "Genie",
                "Hussar",
                "Impid",
                "Neanderthal",
                "Pigskin",
                "Sanguophage",
                "Waster",
                "Yttakin"
            ]
        }
    },
    "anomaly": {
        "name": "Anomaly",
        "scenarios": [
            "The Anomaly"
        ],
        "settings": {
            "Anomaly content": [
                "Ambient horror",
                "Monolith discovered",
                "Monolith awakened"
            ]
        }
    }
}


#--------------------------------------------------------------------------------------------
# Random Generator
#--------------------------------------------------------------------------------------------

def generate_seed(length=10):
    characters = string.ascii_lowercase + string.digits
    return "".join(random.choice(characters) for _ in range(length))


def get_active_dlcs(selected_dlcs):
    return [dlc for dlc in selected_dlcs if dlc in DLC_OPTIONS]


def build_options(active_dlcs):
    scenarios = list(SCENARIO)

    for dlc in active_dlcs:
        scenarios.extend(DLC_OPTIONS[dlc].get("scenarios", []))

    return {
        "scenarios": scenarios,
        "storytellers": list(STORYTELLER),
        "difficulties": list(DIFFICULTIES)
    }


def generate_dlc_settings(active_dlcs):
    settings = {}

    for dlc in active_dlcs:
        for setting_name, values in DLC_OPTIONS[dlc].get("settings", {}).items():
            settings[setting_name] = random.choice(values)

    return settings


def generate_start_parameters(active_dlcs=None):
    active_dlcs = get_active_dlcs(active_dlcs or [])
    options = build_options(active_dlcs)

    return {
        "scenario": random.choice(options["scenarios"]),
        "storyteller": random.choice(options["storytellers"]),
        "difficulty": random.choice(options["difficulties"]),
        "seed": generate_seed(),
        "map_clicks": random.randint(1, 9),
        "character_rerolls": random.randint(1, 9),
        "dlc_settings": generate_dlc_settings(active_dlcs)
    }


#--------------------------------------------------------------------------------------------
# Routes
#--------------------------------------------------------------------------------------------

@app.route("/")
def index():
    active_dlcs = get_active_dlcs(request.args.getlist("dlc"))
    parameters = generate_start_parameters(active_dlcs)

    return render_template(
        "index.html",
        dlc_options=DLC_OPTIONS,
        active_dlcs=active_dlcs,
        parameters=parameters
    )

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == "__main__":
    threading.Timer(1.0, open_browser).start()
    app.run(debug=False)
