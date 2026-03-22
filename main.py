from groq_llm import chat
from memory.interaction_logger import log_interaction
from skills.skills_extractor import extract_skills
from skills.skill_store import add_skills

while True:
    query = input("User: ")

    response = chat(query)

    print("Assistant:", response)

    log_interaction(query, response)

    skills = extract_skills()

    if skills:
        add_skills(skills)