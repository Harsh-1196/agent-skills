import os
from dotenv import load_dotenv
import config
from openai  import OpenAI

#load the api key
load_dotenv()

#initialize the client
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

#load model
def chat(messages: str = None, *, system: str = None, message: str = None) -> str:
    """
    Two call patterns:
      1. chat("some query")            – simple user message
      2. chat(system="...", message="...") – system + user message (for skill extraction)
    """
    chat_messages = []

    if system:
        chat_messages.append({"role": "system", "content": system})

    # Use 'message' kwarg if provided, otherwise fall back to positional 'messages'
    user_content = message if message is not None else messages
    if user_content:
        chat_messages.append({"role": "user", "content": user_content})

    response = client.chat.completions.create(
        model=config.grok_MODEL_NAME,
        messages=chat_messages,
        temperature=0.7
    )
    return response.choices[0].message.content