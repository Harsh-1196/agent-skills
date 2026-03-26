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

async def search_active_skills(embedding: list, limit: int = 3):
    """
    Performs vector search on the active_skills collection.
    First tries Atlas $vectorSearch (requires index 'skills_vector_index').
    Falls back to manual cosine similarity if Atlas index is unavailable.
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
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]

    try:
        cursor = active_skills_col.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        if results:
            for r in results:
                r["_id"] = str(r["_id"])
            print(f"✅ Atlas vector search returned {len(results)} results")
            return results
        print("⚠️ Atlas vector search returned 0 results, trying fallback...")
    except Exception as e:
        print(f"⚠️ Atlas vector search unavailable ({e}), using cosine fallback...")

    # --- Attempt 2: Manual cosine similarity fallback ---
    try:
        cursor = active_skills_col.find({"embedding": {"$exists": True, "$ne": []}})
        all_skills = await cursor.to_list(length=200)
        
        if not all_skills:
            print("⚠️ No active skills with embeddings found")
            return []
        
        import math
        def cosine_sim(a, b):
            if len(a) != len(b):
                return 0.0
            dot = sum(x * y for x, y in zip(a, b))
            mag_a = math.sqrt(sum(x * x for x in a))
            mag_b = math.sqrt(sum(x * x for x in b))
            if mag_a == 0 or mag_b == 0:
                return 0.0
            return dot / (mag_a * mag_b)
        
        scored = []
        for skill in all_skills:
            score = cosine_sim(embedding, skill.get("embedding", []))
            scored.append({
                "_id": str(skill["_id"]),
                "name": skill.get("name", ""),
                "description": skill.get("description", ""),
                "score": score
            })
        
        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]
        print(f"✅ Cosine fallback returned {len(results)} results")
        for r in results:
            print(f"   - {r['name']} (score: {r['score']:.4f})")
        return results
    except Exception as e:
        print(f"❌ Cosine fallback also failed: {e}")
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
