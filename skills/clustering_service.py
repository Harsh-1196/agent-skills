import asyncio
from skills.mongodb_store import candidates_col, db
from llm_service import observer_chat
import json

async def run_clustering_job():
    """
    Identifies 'Semantic Density' in SkillCandidates.
    If multiple candidates are similar, it triggers a promotion suggestion.
    """
    print("Running Clustering Job...")
    
    # 1. Group candidates by similarity (simplified for demo)
    # In a real system, we'd use vector search in a loop or a proper clustering algorithm.
    # Here, we'll look for similar 'intent_core' values using LLM summarization of the queue.
    
    cursor = candidates_col.find({}).sort("timestamp", -1)
    candidates = await cursor.to_list(length=50)
    
    if len(candidates) < 3:
        print("Not enough candidates for clustering.")
        return

    # 2. Ask LLM to detect clusters and write a single Instruction Block
    summary_prompt = f"""
    Here are the recent interaction signatures extracted by the Observer system:
    {json.dumps([{"intent_core": c["intent_core"], "logic": c["extracted_logic"]} for c in candidates], indent=2)}

    Identify if there are any "Persistent Patterns" (at least 3 similar intents).
    If yes, write a single, concise 'Skill Instruction' that covers all of them.

    Output format:
    {{
        "pattern_detected": bool,
        "name": "Concise Skill Name",
        "description": "What this skill does",
        "trigger": "Core intent/keyword",
        "instructions": "Markdown block of instructions for future prompts",
        "candidate_ids": ["id1", "id2", "id3"]
    }}

    Return ONLY valid JSON.
    """
    
    try:
        raw_result = observer_chat(summary_prompt)
        data = json.loads(raw_result)
        
        if data.get("pattern_detected"):
            print(f"New Pattern Detected: {data['name']}")
            # We could push this to a 'PendingApprovals' collection
            # or handle it in the UI via the candidates endpoint.
            # For now, let's mark these candidates as "clustered" or similar.
            return data
    except Exception as e:
        print(f"Clustering Job Error: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(run_clustering_job())
