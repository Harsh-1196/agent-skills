import os
from dotenv import load_dotenv

load_dotenv()

# Gemini Configuration (Main Chat + Embeddings)
CHAT_MODEL = "gemini-2.5-flash" 
EMBEDDING_MODEL = "models/gemini-embedding-001"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Groq Configuration (Observer + Clustering)
OBSERVER_MODEL = os.getenv("OBSERVER_MODEL", "openai/gpt-oss-20b")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Backwards compatibility
MODEL_NAME = CHAT_MODEL
grok_MODEL_NAME = OBSERVER_MODEL