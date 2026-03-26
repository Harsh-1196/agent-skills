import os
import time
import json
from dotenv import load_dotenv
from google import genai
from groq import Groq
import config
from retrieval.skill_retriever import get_skills_context

# Load environment variables
load_dotenv()

# Initialize Clients
gemini_client = genai.Client()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 🔥 Formatter Prompt (controls output style)
FORMATTER_PROMPT = """
You are a response formatter optimized for clean display and streaming.
Your goal is to produce clean, readable, and properly formatted text that respects the original structure and displays correctly in a streaming UI.
"""

def build_prompt(user_input: str, skills: list = None) -> str:
    skills_context = get_skills_context(skills)
    return f"{FORMATTER_PROMPT}{skills_context}\n\nUser Input:\n{user_input}"

# =========================
# ✅ CHAT (GEMINI)
# =========================
def chat(messages: str, skills: list = None) -> str:
    prompt = build_prompt(messages, skills)
    response = gemini_client.models.generate_content(
        model=config.CHAT_MODEL,
        contents=prompt
    )
    return response.text

# =========================
# 🔥 TYPEWRITER STREAM (HYBRID WITH FAILOVER)
# =========================
def chat_stream(messages: str, skills: list = None):
    prompt = build_prompt(messages, skills)
    
    # Try Gemini First
    try:
        response = gemini_client.models.generate_content_stream(
            model=config.CHAT_MODEL,
            contents=prompt
        )
        for chunk in response:
            if chunk.text:
                for char in chunk.text:
                    yield char
                    if char in ".!?":
                        time.sleep(0.25)
                    elif char == ",":
                        time.sleep(0.1)
                    else:
                        time.sleep(0.015)
        return # Success
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            # 🔥 Fallback to Groq
            fallback_msg = "\n\n[SYSTEM]: Gemini quota exceeded. Failing over to Groq (Llama 3)...\n\n"
            for char in fallback_msg:
                yield char
                time.sleep(0.01)
            
            try:
                response = groq_client.chat.completions.create(
                    model=config.OBSERVER_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    stream=True
                )
                for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content:
                        for char in content:
                            yield char
                            if char in ".!?":
                                time.sleep(0.2)
                            else:
                                time.sleep(0.01)
            except Exception as ge:
                yield f"\n\n[CRITICAL_ERROR]: Both providers failed. {str(ge)}"
        else:
            yield f"\n\n[SYSTEM_ERROR]: {error_str}"

# =========================
# 🧬 EMBEDDING LOGIC (GEMINI)
# =========================
def get_embedding(text: str) -> list:
    """Generates vector embeddings using Gemini."""
    result = gemini_client.models.embed_content(
        model=config.EMBEDDING_MODEL,
        contents=text
    )
    return result.embeddings[0].values

# =========================
# 👁️ OBSERVER MODEL (FAST - GROQ)
# =========================
def observer_chat(prompt: str) -> str:
    """Uses Groq (Llama 3.3) for background analysis/extraction."""
    response = groq_client.chat.completions.create(
        model=config.OBSERVER_MODEL,
        messages=[
            {"role": "system", "content": "You are a structured extraction observer. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    user_input = "Hello"
    print("Testing Hybrid Flow...")
    for char in chat_stream(user_input):
        print(char, end="", flush=True)
    print("\nEmbedding Size:", len(get_embedding("test")))
    print("Observer Result:", observer_chat("Analysis test"))