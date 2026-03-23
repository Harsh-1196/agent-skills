import json
import asyncio
from llm_service import observer_chat, get_embedding
from skills.mongodb_store import save_candidate

OBSERVER_PROMPT = """
Analyze the following user prompt and AI response to extract an Interaction Signature.
The goal is to understand the recurring intent, style, and constraints for a potential "Skill".

User Prompt: {query}
AI Response: {response}

Output a JSON object with the following fields:
intent_core: A concise description of the recurring intent (e.g., "Code Refactoring")
style_markers: A list of style-related attributes (e.g., ["Functional programming", "No comments"])
constraints: A list of constraints identified (e.g., ["Must be under 20 lines"])
extracted_logic: The core transformation logic or rule used (The "Delta"). 
                 Example: "If user asks to make shorter, remove all adjectives and use bullet points."

Return ONLY valid JSON.
"""

async def run_observer(query: str, response: str, session_id: str = None):
    """
    Runs the Observer analysis in the background.
    Extracts structured logic and saves it to the Candidate Phase (Tier 1).
    """
    prompt = OBSERVER_PROMPT.format(query=query, response=response)
    
    try:
        raw_result = observer_chat(prompt)
        
        # Robust JSON cleaning
        clean_json = raw_result.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.strip("`").strip()
            if clean_json.startswith("json"):
                clean_json = clean_json[4:].strip()
        
        data = json.loads(clean_json)
        
        # Calculate embedding for intent_core (used for clustering)
        intent_core = data.get("intent_core", "")
        embedding = get_embedding(intent_core)
        
        # Save to Tier 1: SkillCandidates
        candidate_id = await save_candidate(
            raw_query=query,
            extracted_logic=data.get("extracted_logic", ""),
            intent_core=intent_core,
            style_markers=data.get("style_markers", []),
            constraints=data.get("constraints", []),
            embedding=embedding,
            session_id=session_id
        )
        
        print(f"Skill Candidate extracted and saved: {candidate_id}")
        return candidate_id
        
    except Exception as e:
        import traceback
        print(f"❌ Observer Error: {e}")
        print(f"TRACEBACK: {traceback.format_exc()}")
        try:
            print(f"RAW RESULT WAS: {raw_result}")
        except:
            pass
        return None
