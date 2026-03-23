import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import json

from gemini_llm import chat_stream
from memory.interaction_logger import log_interaction
from skills.skills_extractor import extract_skills
from skills.skill_store import add_skills

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

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    query = request.query
    
    def generate():
        full_response = ""
        
        # 🧠 Skills are now handled internally by the retrieval module in build_prompt
        for chunk in chat_stream(query):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
        try:
            log_interaction(query, full_response)
            skills = extract_skills()
            if skills:
                add_skills(skills)
        except Exception as e:
            print(f"Background save error: {e}")
            
    return StreamingResponse(generate(), media_type="text/event-stream")

ui_dir = os.path.join(os.path.dirname(__file__), "ui", "dist")
if os.path.exists(ui_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(ui_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        index_path = os.path.join(ui_dir, "index.html")
        return FileResponse(index_path)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Starting Chanakya AI Unified Server...")
    print("👉 1. The Python LLM Backend is ACTIVE.")
    print("👉 2. The React Frontend is being SERVED.")
    print("🔗 OPEN THIS IN YOUR BROWSER: http://localhost:8000")
    print("="*50 + "\n")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
