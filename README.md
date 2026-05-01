# AI-First CRM HCP Module

## Prerequisites
- Node.js (v16+)
- Python 3.9+
- A valid Groq API Key

## Setup & Running

### 1. Backend (FastAPI + LangGraph)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set your Groq API key:
   - On Windows (PowerShell): `$env:GROQ_API_KEY="your_api_key"`
   - On Mac/Linux: `export GROQ_API_KEY="your_api_key"`
3. Activate the virtual environment (it has already been created):
   - On Windows: `.\venv\Scripts\activate`
   - On Mac/Linux: `source venv/bin/activate`
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Frontend (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the URL provided by Vite (usually `http://localhost:5173`).

## Usage
- The application will automatically create an SQLite database (`crm_hcp.db`) in the `backend` folder on the first run.
- Use the **Structured Form** to directly insert records into the database.
- Use the **AI Chat Assistant** to type natural language interactions (e.g., *"I just met Dr. Smith. We talked about Drug X. He is very positive. Schedule a follow up in 7 days to drop off samples."*). The LLM will extract the entities and call the respective tools to insert the logs and follow-ups.
