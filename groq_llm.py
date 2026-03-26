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
def chat(messages: str) -> str:
    response = client.chat.completions.create(
        model=config.grok_MODEL_NAME,
        messages=[
            {"role": "user", "content": messages}
        ],
        temperature=0.7
    )
    return response.choices[0].message.content