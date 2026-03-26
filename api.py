import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import json

from llm_service import chat_stream, get_embedding
from memory.interaction_logger import log_interaction
from skills.observer import run_observer
from skills.mongodb_store import candidates_col, promote_to_active, search_active_skills
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

class PromotionRequest(BaseModel):
    candidate_id: str
    name: str
    description: str
    trigger: str
    instructions: str

class SearchRequest(BaseModel):
    query: str

@app.post("/api/skills/search")
async def search_skills(request: SearchRequest):
    """Real-time skill search for typeahead suggestions while typing."""
    query = request.query.strip()
    if len(query) < 3:
        return {"matches": []}
    
    try:
        query_embedding = get_embedding(query)
        results = await search_active_skills(query_embedding, limit=3)
        matches = []
        for r in results:
            matches.append({
                "skill": r.get("name", ""),
                "description": r.get("description", ""),
                "score": round(r.get("score", 0), 3)
            })
        return {"matches": matches}
    except Exception as e:
        print(f"Skill search error: {e}")
        return {"matches": []}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    query = request.query
    
    async def generate():
        full_response = ""
        
        # 🔍 Vector search: embed query and find matching active skills
        try:
            print(f"🔍 Embedding query: '{query[:50]}...'")
            query_embedding = get_embedding(query)
            print(f"✅ Embedding generated ({len(query_embedding)} dimensions)")
            
            skill_results = await search_active_skills(query_embedding, limit=3)
            print(f"🔍 Vector search returned {len(skill_results)} results")
            
            if skill_results:
                for i, r in enumerate(skill_results):
                    print(f"   Match {i+1}: {r.get('name', '?')} (score: {r.get('score', 0):.3f})")
                
                # Emit top match as early SSE event
                top = skill_results[0]
                yield f"data: {json.dumps({'type': 'skill_match', 'skill': top.get('name', ''), 'score': round(top.get('score', 0), 3)})}\n\n"
                
                # Emit all matches as early SSE event
                matches = [{"skill": r.get("name", ""), "score": round(r.get("score", 0), 3)} for r in skill_results]
                yield f"data: {json.dumps({'type': 'skill_matches', 'matches': matches})}\n\n"
            else:
                print("⚠️ Vector search returned 0 results (no matching skills or index missing)")
        except Exception as e:
            print(f"❌ Skill vector search failed (non-blocking): {e}")
            import traceback
            traceback.print_exc()
        
        # 🧠 Skills are handled internally by gemini_llm -> skill_retriever -> mongodb_store
        for chunk in chat_stream(query):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
        try:
            log_interaction(query, full_response)
            # 🔥 Trigger the Observer in the background (Non-blocking)
            asyncio.create_task(run_observer(query, full_response))
        except Exception as e:
            print(f"Background Observer error: {e}")
            
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/api/patterns/candidates")
async def get_candidates():
    """Returns the extraction queue for the UI."""
    cursor = candidates_col.find({}).sort("timestamp", -1)
    candidates = await cursor.to_list(length=20)
    for c in candidates:
        c["_id"] = str(c["_id"])
        # Remove embedding from UI response to keep it light
        if "embedding" in c: del c["embedding"]
    return candidates

@app.post("/api/patterns/approve")
async def approve_pattern(request: PromotionRequest):
    """Promotes a candidate to an Active Skill."""
    from bson import ObjectId
    skill_data = {
        "name": request.name,
        "description": request.description,
        "trigger": request.trigger,
        "instructions": request.instructions,
    }
    # Optional: Get embedding for the new active skill if needed for later retrieval
    from llm_service import get_embedding
    skill_data["embedding"] = get_embedding(request.instructions)
    
    await promote_to_active(skill_data)
    # Remove the candidate after promotion
    await candidates_col.delete_one({"_id": ObjectId(request.candidate_id)})
    return {"status": "success", "message": f"Skill '{request.name}' activated."}

@app.post("/api/patterns/ignore")
async def ignore_pattern(request: dict):
    """Removes a candidate from the queue without promoting."""
    from bson import ObjectId
    candidate_id = request.get("candidate_id")
    if not candidate_id:
        return {"status": "error", "message": "Missing candidate_id"}
    
    await candidates_col.delete_one({"_id": ObjectId(candidate_id)})
    return {"status": "success", "message": "Pattern ignored."}

ui_dir = os.path.join(os.path.dirname(__file__), "ui", "dist")
if os.path.exists(ui_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(ui_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        index_path = os.path.join(ui_dir, "index.html")
        return FileResponse(index_path)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Starting Kaushal AI Unified Server...")
    print("👉 1. The Python LLM Backend is ACTIVE.")
    print("👉 2. The React Frontend is being SERVED.")
    print("🔗 OPEN THIS IN YOUR BROWSER: http://localhost:8000")
    print("="*50 + "\n")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
