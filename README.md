# Adaptive Agent Skills

A Python-based conversational AI agent designed to dynamically learn and extract reusable skills from user interactions. The agent chats with you, transparently logs the history of your interactions, and periodically analyzes the conversation context to develop specialized "skills", storing them in a local knowledge base for future reference.

## Features

- **Conversational REPL**: A responsive command-line interface powered by state-of-the-art LLMs.
- **Interaction Memory Base**: Automatically logs the entire chat history (queries and responses) in a structured `.jsonl` format.
- **Dynamic Skill Extraction**: Analyzes recent chat history (every 5 interactions) and automatically distills recognized patterns into reusable JSON "skills" (including triggers, instructions, and descriptions).
- **Multi-Model Support**: Easily extensible AI wrappers for Groq (Llama-3) and Google Gemini models.

## Project Structure

```text
agent-skills/
├── main.py                          # Main entry point and chat loop
├── config.py                        # Model configuration settings
├── .env                             # Environment variables (API keys)
├── groq_llm.py                      # Groq API integration
├── gemini_llm.py                    # Google Gemini API integration
├── memory/
│   └── interaction_logger.py        # Module for logging & loading interactions
├── skills/
│   ├── skills_extractor.py          # LLM-based logic to extract skills
│   └── skill_store.py               # Persists and loads `.json` skills
└── data/                            # Auto-generated runtime data
    ├── interactions.jsonl           # Log of all queries and responses
    └── skills.json                  # Extracted skills knowledge base
```

## Prerequisites

- Python 3.8+
- The following Python libraries:
  - `openai`
  - `python-dotenv`
  - `google-generativeai`

## Installation

1. Clone or download the repository to your local machine.
2. Initialize and activate a virtual environment (recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install openai python-dotenv google-generativeai
   ```
4. Configure your API keys. Create a `.env` file in the root directory (if not already present):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

## Configuration

You can update the models used by editing `config.py`. By default:
- `mdoel_name`: Specifies the Groq model (e.g., `llama-3.3-70b-versatile`).
- `MODEL_NAME`: Specifies the Gemini model (e.g., `gemini-2.5-flash`).

## Usage

Start the agent directly via the terminal:

```bash
python3 main.py
```

1. You will be greeted by a `User: ` prompt.
2. Type your query and press Enter. The agent will respond, and the interaction will be securely logged in `data/interactions.jsonl`.
3. Keep chatting! Once the threshold is met (every 5 interactions), the `skills_extractor` will engage. You will see raw outputs as the agent uses LLM logic to distil and save new behaviors to `data/skills.json`.

## Extending the Agent

- **New Models**: You can add new `.py` scripts following the signature in `groq_llm.py` and replace the import in `main.py`.
- **Advanced Skill Execution**: Currently, the system builds a knowledge tree in `skills.json`. You can build further execution orchestration modules on top of this stored metadata.

## License

This project is licensed under the MIT License.
