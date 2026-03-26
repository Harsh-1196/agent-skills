# Chanakya AI (Neural Monolith)

A next-generation, cyberpunk-styled dashboard powered by Adaptive Agent Skills. Chanakya AI features a stunning "Synapse Monolith" React interface over a blazing fast Python API, designed to dynamically learn, stream real-time responses, and extract reusable skills from user interactions.

## Features

- **Holographic Neural UI**: A deeply satisfying, cyberpunk-themed React (Vite) interface complete with animated particle networks and immersive typewriter streaming effects.
- **Server-Sent Events (SSE) Streaming**: Connects seamlessly to the FastAPI backend to stream Gemini LLM tokens in real-time, simulating an authentic terminal intelligence.
- **Interaction Memory Base**: Automatically logs the entire chat history in a structured `.jsonl` format behind the scenes.
- **Dynamic Skill Extraction**: Analyzes recent chat history and distills recognized patterns into reusable JSON "skills" (including triggers, instructions, and descriptions).
- **Google GenAI Support**: Uses the latest `google-genai` SDK with custom personality prompts for clean, beautiful formatting.

## Project Structure

```text
agent-skills/
├── api.py                           # Unified FastAPI server (Backend + serves UI)
├── main.py                          # Legacy terminal chat loop
├── config.py                        # Model configuration settings
├── .env                             # Environment variables (API keys)
├── gemini_llm.py                    # Google Gemini streaming integration
├── memory/
│   └── interaction_logger.py        # Module for logging & loading interactions
├── skills/
│   ├── skills_extractor.py          # LLM-based logic to extract skills
│   └── skill_store.py               # Persists and loads `.json` skills
├── ui/                              # The React + Vite neo-terminal frontend
└── data/                            # Auto-generated runtime data
    ├── interactions.jsonl           
    └── skills.json                  
```

## Prerequisites

- Python 3.12+
- Node.js & npm (for building the UI)

## Installation

1. Clone or download the repository to your local machine.
2. Configure your API keys in a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Install the Python dependencies:
   ```bash
   pip install fastapi uvicorn google-genai openai python-dotenv pydantic
   ```
4. Build the React UI (if making dev changes):
   ```bash
   cd ui
   npm install
   npm run build
   cd ..
   ```

## Usage

Start the unified backend + frontend server:

```bash
python3 api.py
```

1. Open your browser and navigate to **http://localhost:8000**
2. You will be greeted by the `NEURAL_MONOLITH` dashboard.
3. Type your query into the terminal input at the bottom and watch the intelligence stream back with human-like typewriter delays!
4. Behind the scenes, the agent will learn new skills and log them into `data/skills.json`.
