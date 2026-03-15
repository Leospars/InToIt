import os
from google import genai
import dotenv

dotenv.load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    # query goes here
    contents="Explain how AI works in a few words", 
)

print(response.text)
