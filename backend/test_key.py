import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
print(f"Testing key: {key[:10]}...")

try:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    response = llm.invoke("Hello, are you working?")
    print("Response:", response.content)
except Exception as e:
    print("Error:", e)
