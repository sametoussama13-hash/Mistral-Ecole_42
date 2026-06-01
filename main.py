from dotenv import load_dotenv
from mistralai.client import Mistral
import os

load_dotenv()

api_key = os.getenv("MISTRAL_API_KEY")

client = Mistral(api_key=api_key)

response = client.chat.complete(
    model="mistral-large-latest",
    messages=[
        {"role": "user", "content": "what mistral AI?"}
    ]
)
print("response =", response.choices[0].message.content)