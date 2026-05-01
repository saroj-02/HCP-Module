from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
from agent import process_chat_message
import os

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI CRM HCP Module")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, you should list your frontend URL here for safety.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat_endpoint(req: schemas.ChatRequest):
    try:
        response = await process_chat_message(req.message, req.thread_id)
        return {"reply": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/log_interaction")
async def log_interaction_endpoint(req: schemas.FormRequest, db: Session = Depends(get_db)):
    # Direct form submission bypasses conversational agent but uses LLM for summarization in a real scenario
    # Here we just save directly
    hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{req.hcp_name}%")).first()
    if not hcp:
        hcp = models.HCP(name=req.hcp_name, specialty="Unknown")
        db.add(hcp)
        db.commit()
        db.refresh(hcp)
    
    interaction = models.Interaction(
        hcp_id=hcp.id,
        notes=req.notes,
        sentiment=req.sentiment,
        interaction_type=req.interaction_type,
        summary=f"Interaction logged via form."
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    return {"status": "success", "message": f"Interaction logged via form. ID: {interaction.id}"}

@app.get("/api/interactions")
def get_interactions(db: Session = Depends(get_db)):
    interactions = db.query(models.Interaction).order_by(models.Interaction.date.desc()).limit(20).all()
    results = []
    for i in interactions:
        results.append({
            "id": i.id,
            "hcp_name": i.hcp.name if i.hcp else "Unknown",
            "date": i.date,
            "interaction_type": i.interaction_type,
            "notes": i.notes,
            "sentiment": i.sentiment,
            "summary": i.summary
        })
    return results

# Serve static files from the frontend/dist directory
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    # Use port from environment variable for Render
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
