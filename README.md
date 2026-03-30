# Kaushal AI

Kaushal AI is an adaptive, agentic AI assistant designed to continuously learn and evolve from user interactions. Built with a robust FastAPI backend and a responsive React frontend, the system dynamically observes chat conversations, extracts recurring workflows or patterns, and queues them for human approval. Once approved, these highly specialized "skills" are stored in MongoDB.

During subsequent conversations, Kaushal AI uses a blazingly fast hybrid search mechanism—attempting a text match first, dynamically falling back to an LLM-based vector semantic search—to inject relevant capabilities into its generative context, effectively answering queries with learned expertise through Server-Sent Events (SSE) streaming.

## 🌟 Features

- **Hybrid Skill Retrieval:** Real-time search pipeline that implements deterministic text matching with a rapid fallback to embedding-based vector search for conceptual matching.
- **Continuous Learning Loop:** An asynchronous background Observer analyzes interaction logs and extracts structural candidates into an extraction queue without blocking the main event stream.
- **Queue Management UI:** A dedicated interface to review extracted skill candidates, allowing users to promote them to Active Skills or ignore them.
- **Server-Sent Events (SSE):** True real-time streaming of LLM tokens, skill matching events, and benchmarking data directly to the frontend.
- **Unified Architecture:** A single FastAPI server that acts as the backend api and serves the pre-built React frontend assets.
- **Performance Benchmarking:** Real-time telemetry tracking query latency, phase durations (text match, vector search, LLM generation), and cost evaluation.

## 🏗️ Architecture

```mermaid
graph TD
    User([User]) <-->|Chat & Admin| UI[React UI]
    
    UI <-->|API Calls & SSE| API[FastAPI Backend]
    
    subgraph Retrieval Pipeline
        API -->|Incoming Query| Search[Hybrid Search]
        Search -->|1. Fast Text Match| ActiveDB[(MongoDB: Active Skills)]
        Search -.-x|2. Fallback: Embeddings| Embed[Embedding Model]
        Embed -->|Vector Search| ActiveDB
        Search -->|Skill Context| LLM[LLM Generation]
    end
    
    LLM -->|Stream Response| API
    
    subgraph Learning Pipeline
        API -.->|Async Trigger| Observer[Background Observer]
        Observer -->|Extract Patterns| Pipeline[Retrieval & Formatting]
        Pipeline -->|Store Candidates| CandidateDB[(MongoDB: Candidate Queue)]
    end
    
    UI -->|Approve/Ignore| QueueManager[Queue API]
    QueueManager --> CandidateDB
    CandidateDB -.->|On Approve| ActiveDB
```

## 📂 Project Structure

```text
.
├── agent-skills/              # Backend Core & API
│   ├── api.py                 # Unified FastAPI Gateway
│   ├── config.py              # Global settings and LLM configuration
│   ├── llm_service.py         # Gemini / LLM & Embedding Integration
│   ├── main.py                # Legacy CLI interface
│   ├── skills/                # Core Skill Logic (Extraction & Store)
│   ├── retrieval/             # Advanced Skill Search & Vector Retrieval
│   ├── memory/                # Interaction Logging & History
│   ├── benchmarking/          # Performance & Accuracy Tracking
│   ├── data/                  # Local persistence (JSONL/JSON)
│   └── ui/                    # React Frontend (Vite)
│       ├── src/               # UI components, state, and styles
│       ├── public/            # Static assets and icons
│       └── dist/              # Production optimized build
├── repository_overview.md     # Comprehensive architecture deep-dive
└── README.md                  # Project root overview
```


## 🚀 Installation & Setup

### Prerequisites

- Python 3.12+
- Node.js & npm (for UI development)
- MongoDB instance (Local or Atlas)

### 1. Clone & Configure

Clone the repository and create an `.env` file in the root directory with your API keys and MongoDB connection string:

```env
# Example .env configuration
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=mongodb://localhost:27017
```

### 2. Install Backend Dependencies

Set up a virtual environment and install the required Python packages:

```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```
*(If `requirements.txt` is incomplete, ensure you install `fastapi`, `uvicorn`, `pydantic`, `motor`, `pymongo`, etc.)*

### 3. Build the Frontend

Navigate to the UI directory to install dependencies and build the static assets:

```bash
cd ui
npm install
npm run build
cd ..
```

### 4. Run the Unified Server

Start the FastAPI application which serves both the API and the React frontend:

```bash
python api.py
```

1. Open your browser and navigate to **http://localhost:8000**
2. You will be greeted by Kaushal AI dashboard.
3. Type your query into the terminal input at the bottom and watch the intelligence stream back with human-like typewriter delays!
4. Behind the scenes, the agent will learn new skills and log them into `data/skills.json`.


<div align="center">
  <sub>Built with ❤️ by the Kaushal AI Team</sub>
</div>
