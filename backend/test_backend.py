import requests

url = "http://localhost:8000/api/chat"
data = {
    "message": "Met Dr. Smith today. We discussed the new clinical trial results for Product X. He was very positive and asked for a follow-up meeting in two weeks.",
    "thread_id": "test_thread"
}

try:
    print("Sending request...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
