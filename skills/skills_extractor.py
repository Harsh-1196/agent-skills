from groq_llm import chat
from memory.interaction_logger import load_all_interactions
import json

def extract_skills():
    interactions = load_all_interactions()
    
    if len(interactions) < 5:
        print("Interaction count:", len(interactions))
        return []
    
    recent = interactions[-5:]
    interaction_text = ""

    for i in recent:
        query = i['query']
        response = i['response']

        interaction_text += f"""
        Query: {query}
        Response: {response}
        """

        prompt = f"""
        You are a skill extraction system.

        From the interactions below, extract reusable skills.

        IMPORTANT:
        - Return ONLY valid JSON
        - Do NOT include any explanation
        - Do NOT include text before or after JSON
        - JSON must be directly parsable
        - Do NOT wrap in ```json

        Format:
        [
        {{
            "name": "",
            "description": "",
            "trigger": "",
            "instructions": ""
        }}
        ]

        Interactions:
        {interaction_text}
        """

    result = chat(prompt)
    
    print("\nRAW OUTPUT:\n", result)

    try:
        skills = json.loads(result) # convert the result string into json
        print("\nPARSED SKILLS:\n", skills)
    except Exception as e:
        print("\nJSON PARSE ERROR:\n", e)
        skills = []

    print("\n====== RAW LLM OUTPUT ======\n")
    print(result)
    print("\n===========================\n")

    print("Extracted skills:", skills)
    print("Length:", len(skills))

    return skills
