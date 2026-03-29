import os
import motor.motor_asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "agent_akilla"

print(f"Connecting to MongoDB at: {MONGODB_URI}")
try:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    print(f"✅ MongoDB Async Client Initialized (DB: {DB_NAME})")
except Exception as e:
    print(f"❌ MongoDB Async Connection Error: {e}")

# Sync client for retrieval (to avoid async/await in prompt builder)
import pymongo
try:
    sync_client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    sync_db = sync_client[DB_NAME]
    active_skills_sync_col = sync_db["active_skills"]
    print(f"✅ MongoDB Sync Client Initialized")
except Exception as e:
    print(f"❌ MongoDB Sync Connection Error: {e}")

# Collections
candidates_col = db["skill_candidates"]
active_skills_col = db["active_skills"]

def load_skills_sync():
    """Synchronously loads active skills for prompt building."""
    return list(active_skills_sync_col.find({}))

async def save_candidate(
    raw_query: str,
    extracted_logic: str,
    intent_core: str,
    style_markers: list,
    constraints: list,
    embedding: list = None,
    session_id: str = None
):
    """Saves a skill signature to the Candidate Phase (Tier 1)."""
    candidate = {
        "raw_query": raw_query,
        "extracted_logic": extracted_logic,
        "intent_core": intent_core,
        "style_markers": style_markers,
        "constraints": constraints,
        "embedding": embedding,
        "timestamp": datetime.utcnow(),
        "session_id": session_id
    }
    result = await candidates_col.insert_one(candidate)
    return str(result.inserted_id)

async def get_active_skills():
    """Retrieves all promoted skills (Tier 2)."""
    cursor = active_skills_col.find({})
    skills = await cursor.to_list(length=100)
    for skill in skills:
        skill["_id"] = str(skill["_id"])
    return skills

import re as _re

async def text_match_active_skills(query: str, limit: int = 3):
    """
    Fast text-based matching — no embedding needed.
    Checks if the query closely matches any stored skill's name, trigger, or raw_query.
    Returns results with a 0.99 score for exact matches, 0.95 for substring matches.
    """
    if not query or len(query.strip()) < 3:
        return []

    query_lower = query.strip().lower()
    
    # MongoDB case-insensitive regex search
    escaped = _re.escape(query.strip())
    regex_pattern = {"$regex": escaped, "$options": "i"}
    
    try:
        cursor = active_skills_col.find({
            "$or": [
                {"name": regex_pattern},
                {"trigger": regex_pattern},
                {"raw_query": regex_pattern},
            ]
        }).limit(limit)
        results = await cursor.to_list(length=limit)
        
        if not results:
            return []
        
        matched = []
        for skill in results:
            # Determine score based on match quality
            skill_name = (skill.get("name", "") or "").lower()
            skill_trigger = (skill.get("trigger", "") or "").lower()
            skill_raw_query = (skill.get("raw_query", "") or "").lower()
            
            if query_lower == skill_name or query_lower == skill_trigger or query_lower == skill_raw_query:
                score = 0.99  # Exact match
            elif query_lower in skill_raw_query or skill_raw_query in query_lower:
                score = 0.96  # Close substring match
            else:
                score = 0.92  # Partial match
            
            matched.append({
                "_id": str(skill["_id"]),
                "name": skill.get("name", ""),
                "description": skill.get("description", ""),
                "trigger": skill.get("trigger", ""),
                "instructions": skill.get("instructions", ""),
                "score": score,
            })
        
        matched.sort(key=lambda x: x["score"], reverse=True)
        print(f"⚡ Text match found {len(matched)} results (instant, no embedding needed)")
        for r in matched:
            print(f"   - {r['name']} (score: {r['score']:.2f})")
        return matched
    except Exception as e:
        print(f"⚠️ Text match failed: {e}")
        return []

# Minimum cosine similarity to consider a skill relevant
VECTOR_MIN_SCORE = 0.25

async def search_active_skills(embedding: list, limit: int = 3, query_text: str = ""):
    """
    Performs vector search on the active_skills collection.
    First tries Atlas $vectorSearch (requires index 'skills_vector_index').
    Falls back to hybrid scoring (embedding cosine + text token overlap) if Atlas is unavailable.
    Results below VECTOR_MIN_SCORE are discarded.
    """
    # --- Attempt 1: Atlas Vector Search ---
    pipeline = [
        {
            "$vectorSearch": {
                "index": "skills_vector_index",
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": 50,
                "limit": limit,
            }
        },
        {
            "$project": {
                "name": 1,
                "description": 1,
                "trigger": 1,
                "instructions": 1,
                "raw_query": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]

    try:
        cursor = active_skills_col.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        if results:
            # Filter by minimum score
            results = [r for r in results if r.get("score", 0) >= VECTOR_MIN_SCORE]
            for r in results:
                r["_id"] = str(r["_id"])
            print(f"✅ Atlas vector search returned {len(results)} results (min_score={VECTOR_MIN_SCORE})")
            return results
        print("⚠️ Atlas vector search returned 0 results, trying fallback...")
    except Exception as e:
        print(f"⚠️ Atlas vector search unavailable ({e}), using hybrid fallback...")

    # --- Attempt 2: Hybrid fallback (embedding cosine + text token overlap) ---
    try:
        # Load ALL fields from every skill (not just embedding)
        cursor = active_skills_col.find({})
        all_skills = await cursor.to_list(length=200)
        
        if not all_skills:
            print("⚠️ No active skills found")
            return []
        
        import math

        def cosine_sim(a, b):
            if not a or not b or len(a) != len(b):
                return 0.0
            dot = sum(x * y for x, y in zip(a, b))
            mag_a = math.sqrt(sum(x * x for x in a))
            mag_b = math.sqrt(sum(x * x for x in b))
            if mag_a == 0 or mag_b == 0:
                return 0.0
            return dot / (mag_a * mag_b)

        def _build_skill_text(skill: dict) -> str:
            """Build a comprehensive searchable text from ALL skill fields."""
            parts = [
                skill.get("name", ""),
                skill.get("description", ""),
                skill.get("trigger", ""),
                skill.get("instructions", ""),
                skill.get("raw_query", ""),
                skill.get("intent_core", ""),
                skill.get("extracted_logic", ""),
            ]
            # Include examples if present
            examples = skill.get("examples", [])
            if isinstance(examples, list):
                for ex in examples:
                    if isinstance(ex, dict):
                        parts.append(ex.get("input", ""))
                        parts.append(ex.get("expected_behavior", ""))
                    elif isinstance(ex, str):
                        parts.append(ex)
            return " ".join(p for p in parts if p)

        def _token_overlap_score(query: str, skill_text: str) -> float:
            """
            Query-centric token overlap similarity.
            Measures what fraction of the query's meaningful tokens appear in the skill text.
            Returns a value between 0.0 and 1.0.
            """
            if not query or not skill_text:
                return 0.0
            
            stop = {"a","an","the","is","it","of","in","to","and","or","for","on","with",
                     "as","at","by","this","that","from","be","are","was","how","what",
                     "me","my","i","you","we","can","do","does","not","no"}
            
            q_tokens = set(t for t in query.lower().split() if t not in stop and len(t) > 1)
            s_tokens = set(t for t in skill_text.lower().split() if len(t) > 1)
            
            if not q_tokens:
                return 0.0
            
            # Check exact substring match first (highest confidence)
            query_lower = query.strip().lower()
            skill_lower = skill_text.lower()
            if query_lower in skill_lower:
                return 0.98  # Query is contained verbatim in skill text
            
            matched = q_tokens & s_tokens
            overlap = len(matched) / len(q_tokens)
            
            # Scale: 100% overlap → 0.95, 50% overlap → 0.47
            return overlap * 0.95

        query_lower = query_text.strip().lower() if query_text else ""
        
        scored = []
        for skill in all_skills:
            # Score 1: Embedding cosine similarity (if embedding exists)
            emb_score = 0.0
            skill_embedding = skill.get("embedding", [])
            if skill_embedding and embedding:
                emb_score = cosine_sim(embedding, skill_embedding)
            
            # Score 2: Text token overlap (uses ALL skill fields)
            text_score = 0.0
            if query_lower:
                skill_text = _build_skill_text(skill)
                text_score = _token_overlap_score(query_text, skill_text)
            
            # Take the BEST score from either method
            final_score = max(emb_score, text_score)
            
            if final_score >= VECTOR_MIN_SCORE:
                scored.append({
                    "_id": str(skill["_id"]),
                    "name": skill.get("name", ""),
                    "description": skill.get("description", ""),
                    "trigger": skill.get("trigger", ""),
                    "instructions": skill.get("instructions", ""),
                    "score": final_score,
                    "_emb_score": round(emb_score, 4),
                    "_text_score": round(text_score, 4),
                })
        
        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]
        print(f"✅ Hybrid fallback returned {len(results)} results (filtered by min_score={VECTOR_MIN_SCORE})")
        for r in results:
            print(f"   - {r['name']} (final: {r['score']:.4f} | emb: {r['_emb_score']} | text: {r['_text_score']})")
        
        # Clean internal debug fields before returning
        for r in results:
            r.pop("_emb_score", None)
            r.pop("_text_score", None)
        
        return results
    except Exception as e:
        print(f"❌ Hybrid fallback also failed: {e}")
        import traceback
        traceback.print_exc()
        return []

async def promote_to_active(skill_data: dict):
    """Promotes a clustered pattern to Active Skills (Tier 2)."""
    skill_data["timestamp"] = datetime.utcnow()
    result = await active_skills_col.insert_one(skill_data)
    return str(result.inserted_id)

async def find_similar_candidates(embedding: list, min_similarity: float = 0.92):
    """
    Performs a vector search within the SkillCandidates collection.
    Note: Requires a MongoDB Atlas Vector Search index 'vector_index' on the 'embedding' field.
    If running locally without Atlas, this will need a fallback (e.g., manual calculation).
    """
    # For now, we'll provide a placeholder for Atlas Vector Search if available
    # Or a simple query if not. 
    # To support local development without Atlas, we might need a different approach 
    # but the architecture calls for vectorSearch.
    
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": 100,
                "limit": 10,
            }
        },
        {
            "$project": {
                "_id": 1,
                "intent_core": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        },
        {
            "$match": {"score": {"$gt": min_similarity}}
        }
    ]
    
    try:
        cursor = candidates_col.aggregate(pipeline)
        return await cursor.to_list(length=10)
    except Exception as e:
        print(f"Vector search Error (likely no index): {e}")
        return []
