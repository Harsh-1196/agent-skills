"""
we now need to save the whole interaction for the llm to find patterns and skills later
need to save interactions like this
{
 "query": "explain quicksort",
 "response": "Quicksort works by...",
 "timestamp": 1710562231
}
"""

import json
import time
import os

FILE_PATH = "data/interactions.jsonl"

def log_interaction(query, response):
    interaction = {
        "query": query,
        "response": response,
        "timestamp": time.time()
    }

    os.makedirs("data", exist_ok=True)
    
    with open(FILE_PATH, "a") as f:
        f.write(json.dumps(interaction) + "\n")


def load_all_interactions():

    interactions = []
    try:
        # we use with keyword so that file automatically closees after the interaction is completed
        with open(FILE_PATH, "r") as f:
            for line in f:
                interaction = json.loads(line)
                interactions.append(interaction)
    except FileNotFoundError:
        pass
    return interactions
    
