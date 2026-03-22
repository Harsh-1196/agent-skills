import google.generativeai as genai
import os
from dotenv import load_dotenv
import config

# Load environment variables
load_dotenv()

#configuring the api
genai.configure(api_key = os.getenv("GEMINI_API_KEY"))

#load model
model = genai.GenerativeModel(config.MODEL_NAME)

def chat(messages: str) -> str:
    response = model.generate_content(messages)
    return response.text



