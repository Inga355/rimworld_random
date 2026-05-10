from flask import Flask, render_template
import random
import string


app = Flask(__name__)


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


if __name__ == "__main__":
    app.run(debug=True)
