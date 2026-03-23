import os
import time
from dotenv import load_dotenv
from google import genai
import config
from retrieval.skill_retriever import get_skills_context

# Load environment variables
load_dotenv()

# Initialize Gemini client
client = genai.Client()

# 🔥 Formatter Prompt (controls output style)
FORMATTER_PROMPT = """
You are a response formatter optimized for clean display and streaming.

Your task is to refine raw LLM output while preserving the original intent and structure.

Follow these rules strictly:

1. Clean Unwanted Formatting  
- Remove markdown and decorative symbols such as *, **, #, -, _, backticks, and bullets.  
- Do not add headings or special formatting.

2. Preserve Natural Structure  
- If the response already contains line breaks, spacing, or structure, preserve it.  
- Do NOT force everything into paragraphs.  
- Let the format follow the user’s intent and content type.

3. Escape Character Handling (VERY IMPORTANT)  
- Convert escaped characters into actual formatting:  
  - "\n" → real line break  
  - "\t" → proper spacing or indentation  
- Do not display escape sequences as plain text.

4. Language Refinement  
- Make the text clear, natural, and readable.  
- Remove unnecessary repetition or filler words.  
- Keep it concise but meaningful.

5. Streaming Optimization  
- Ensure the response flows smoothly when displayed character by character.  
- Avoid broken or incomplete sentence fragments.

6. Output Rules  
- Output only the cleaned and formatted response.  
- Do not include explanations or metadata.  
- Do not wrap the output in quotes.

Your goal is to produce clean, readable, and properly formatted text that respects the original structure and displays correctly in a streaming UI.
"""

def build_prompt(user_input: str, skills: list = None) -> str:
    skills_context = get_skills_context(skills)
    return f"{FORMATTER_PROMPT}{skills_context}\n\nUser Input:\n{user_input}"


# =========================
# ✅ NORMAL RESPONSE
# =========================
def chat(messages: str, skills: list = None) -> str:
    prompt = build_prompt(messages, skills)

    response = client.models.generate_content(
        model=config.MODEL_NAME,
        contents=prompt
    )

    return response.text


# =========================
# 🔥 TYPEWRITER STREAM
# =========================
def chat_stream(messages: str, skills: list = None):
    prompt = build_prompt(messages, skills)

    response = client.models.generate_content_stream(
        model=config.MODEL_NAME,
        contents=prompt
    )

    for chunk in response:
        if chunk.text:
            for char in chunk.text:
                yield char

                # ⏱️ Human-like typing delays
                if char in ".!?":
                    time.sleep(0.25)   # sentence pause
                elif char == ",":
                    time.sleep(0.1)    # small pause
                else:
                    time.sleep(0.015)  # normal typing speed


# =========================
# 🧪 TEST (CLI TYPEWRITER)
# =========================
if __name__ == "__main__":
    user_input = input("You: ")

    print("\nAI: ", end="", flush=True)

    for char in chat_stream(user_input):
        print(char, end="", flush=True)

    print("\n")