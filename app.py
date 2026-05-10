from flask import Flask, render_template
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


#--------------------------------------------------------------------------------------------
# Random Generator
#--------------------------------------------------------------------------------------------

def generate_seed(length=10):
    characters = string.ascii_lowercase + string.digits
    return "".join(random.choice(characters) for _ in range(length))


def generate_start_parameters():
    return {
        "scenario": random.choice(SCENARIO),
        "storyteller": random.choice(STORYTELLER),
        "difficulty": random.choice(DIFFICULTIES),
        "seed": generate_seed(),
        "map_clicks": random.randint(1, 9),
        "character_rerolls": random.randint(1, 9)
    }


#--------------------------------------------------------------------------------------------
# Routes
#--------------------------------------------------------------------------------------------

@app.route("/")
def index():
    parameters = generate_start_parameters()
    return render_template("index.html", parameters=parameters)

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == "__main__":
    threading.Timer(1.0, open_browser).start()
    app.run(debug=False)
