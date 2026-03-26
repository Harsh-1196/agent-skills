import os
import json

FILE = "data/skills.json"

def load_skills():
    if not os.path.exists(FILE):
        return []
    with open(FILE, "r") as f:
        content = f.read().strip()
        if not content:
            return []
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return []

def save_skills(skills):
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    with open(FILE, "w") as f:
        json.dump(skills, f, indent=2)


def add_skills(new_skills):

    skills = load_skills()

    skills.extend(new_skills)

    save_skills(skills)