import os
from typing import Annotated, TypedDict, Literal
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from database import SessionLocal
import models
import datetime

from dotenv import load_dotenv
load_dotenv()

# Note: In production, load from environment
os.environ["GROQ_API_KEY"] = os.environ.get("GROQ_API_KEY", "gsk_dummy_key_for_now_replace_with_real_one")

import operator

# Define State
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

# Define Tools
@tool
def log_interaction_tool(hcp_name: str, notes: str, sentiment: str, interaction_type: str):
    """Captures and saves new interaction data into the CRM database."""
    db = SessionLocal()
    # Check if HCP exists
    hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{hcp_name}%")).first()
    if not hcp:
        hcp = models.HCP(name=hcp_name, specialty="Unknown")
        db.add(hcp)
        db.commit()
        db.refresh(hcp)
    
    interaction = models.Interaction(
        hcp_id=hcp.id,
        notes=notes,
        sentiment=sentiment,
        interaction_type=interaction_type,
        summary=f"Interaction about {notes[:50]}..."
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    db.close()
    return f"Successfully logged interaction ID {interaction.id} with {hcp_name}."

@tool
def edit_interaction_tool(interaction_id: int, field_to_update: str, new_value: str):
    """Allows modification of existing logged interaction data. Fields: notes, sentiment, interaction_type."""
    db = SessionLocal()
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not interaction:
        db.close()
        return f"Interaction ID {interaction_id} not found."
    
    if hasattr(interaction, field_to_update):
        setattr(interaction, field_to_update, new_value)
        db.commit()
        db.close()
        return f"Updated {field_to_update} to {new_value} for interaction {interaction_id}."
    else:
        db.close()
        return f"Field {field_to_update} cannot be updated."

@tool
def get_hcp_profile_tool(hcp_name: str):
    """Retrieves the profile and past interaction history of a specific HCP."""
    db = SessionLocal()
    hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{hcp_name}%")).first()
    if not hcp:
        db.close()
        return f"No profile found for {hcp_name}."
    
    interactions = db.query(models.Interaction).filter(models.Interaction.hcp_id == hcp.id).order_by(models.Interaction.date.desc()).limit(5).all()
    history = "\n".join([f"- {i.date.strftime('%Y-%m-%d')}: [{i.sentiment}] {i.notes[:50]}" for i in interactions])
    hcp_name = hcp.name
    hcp_specialty = hcp.specialty
    db.close()
    return f"Profile for {hcp_name} (Specialty: {hcp_specialty}).\nRecent History:\n{history}"

@tool
def schedule_followup_tool(hcp_name: str, days_from_now: int, description: str):
    """Creates a calendar event or task reminder for a future follow-up with the HCP."""
    db = SessionLocal()
    hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{hcp_name}%")).first()
    if not hcp:
        db.close()
        return f"Cannot schedule follow-up. HCP {hcp_name} not found."
    
    follow_up_date = datetime.datetime.utcnow() + datetime.timedelta(days=days_from_now)
    followup = models.FollowUp(
        hcp_id=hcp.id,
        scheduled_date=follow_up_date,
        description=description
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)
    
    # Store needed values before closing session
    f_id = followup.id
    h_name = hcp.name
    
    db.close()
    return f"Scheduled follow-up ID {f_id} with {h_name} on {follow_up_date.strftime('%Y-%m-%d')} for: {description}."

@tool
def fetch_clinical_insights_tool(topic: str):
    """Retrieves approved medical guidelines, safety info, or clinical trial data."""
    # Mock RAG retrieval
    insights = {
        "drug x": "Drug X has shown 20% higher efficacy in Phase 3 trials. Side effects include mild nausea.",
        "drug y": "Drug Y is contraindicated for patients with hypertension.",
    }
    for key, value in insights.items():
        if key in topic.lower():
            return value
    return f"General clinical guidelines regarding {topic}: Consult the latest FDA approvals and internal medical affairs documents."

# Initialize Model and Tools
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
tools = [
    log_interaction_tool, 
    edit_interaction_tool, 
    get_hcp_profile_tool, 
    schedule_followup_tool, 
    fetch_clinical_insights_tool
]
llm_with_tools = llm.bind_tools(tools)

# Define Graph Nodes
def chatbot(state: AgentState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

graph_builder = StateGraph(AgentState)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", ToolNode(tools=tools))

def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    messages = state["messages"]
    last_message = messages[-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "__end__"

graph_builder.add_conditional_edges("chatbot", should_continue)
graph_builder.add_edge("tools", "chatbot")
graph_builder.set_entry_point("chatbot")
graph = graph_builder.compile()

# Memory for simplicity (in memory dict for threads)
threads = {}

async def process_chat_message(message: str, thread_id: str):
    now = datetime.datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")

    if thread_id not in threads:
        threads[thread_id] = {"messages": [
            SystemMessage(content=f"""You are a Life Sciences Sales Representative AI Assistant. Your goal is to simplify CRM logging and provide high-quality medical information.

**Current Date**: {current_date}
**Current Time**: {current_time}

### MANDATORY OPERATING PROTOCOL (PER MESSAGE):
You must perform TWO tasks for every user interaction without fail:

1. **TASK 1: FORM SYNCHRONIZATION (JSON)**
   - Analyze user details for HCP name, interaction type, topics, etc.
   - **ADVANCED ANALYTICS (MANDATORY)**: For every interaction, predict the following fields based on user context:
     - `hcp_persona`: (e.g., Early Adopter, Conservative, Academic, Evidence-Seeker).
     - `next_best_action`: (e.g., Send Case Study, Schedule F2F, Invite to Webinar).
     - `predicted_channel`: Best channel for next contact.
     - `predicted_time`: Best time for next contact.
     - `roi_potential`: (High, Medium, Low).
   - Fields: hcp_name, interaction_type, date, time, attendees, topics, sentiment, outcomes, follow_ups, preferred_channel, channel_preference_reason, event_type, hcp_persona, next_best_action, predicted_channel, predicted_time, roi_potential.
   - Immediately output a ```json``` block with these fields.
   - This block MUST be the first thing in your response content.

2. **TASK 2: HYPER-PERSONALIZED CLINICAL INSIGHTS**
   - Identify the medical topic and the HCP's specialty (if mentioned).
   - Provide **Evidence-Based Content**: Scientific data, clinical case studies, Real-World Evidence (RWE).
   - Format: Use ### sections for "Clinical Evidence", "Real-World Data", and "Safety Profile".
   - **Bite-sized Information**: Keep descriptions concise and impactful for busy doctors.
   - Use `fetch_clinical_insights_tool` for data.

**COMPLIANCE & SECURITY**:
- Always maintain a tone that reflects **GDPR/HIPAA** sensitivity and **IFPMA** ethical standards.
- **DO NOT** repeat the logging details in the chat text; focus purely on the TOPIC information and NEXT-BEST ACTION.

Example Output:
```json
{{ "hcp_name": "Dr. Smith", "hcp_persona": "Early Adopter", "next_best_action": "Invite to Hybrid Summit", ... }}
```
### Clinical Evidence: [Drug Name]
[...]
### Next-Best Action Insight
Based on Dr. Smith's interest in RWE, the next best step is to share the [Trial Name] summary via LinkedIn.
""")
        ]}
    
    # Append user message
    threads[thread_id]["messages"].append(HumanMessage(content=message))
    
    try:
        # Run graph
        result = graph.invoke(threads[thread_id])
        
        # Update memory
        threads[thread_id] = result
        
        # Collect all AI messages since the last HumanMessage to ensure we don't miss JSON blocks
        # that might have been sent along with tool calls.
        ai_contents = []
        for msg in reversed(result["messages"]):
            if isinstance(msg, HumanMessage):
                break
            if isinstance(msg, AIMessage) and msg.content:
                ai_contents.insert(0, msg.content)
        
        final_response = "\n\n".join(ai_contents)
        return final_response if final_response else "I've processed your request."
    except Exception as e:
        print(f"Graph invocation error: {e}")
        # Return a friendly error message so the UI shows this instead of crashing
        if "401" in str(e) or "key" in str(e).lower() or "authentication" in str(e).lower():
            return "Authentication Error: Please provide a valid Groq API Key in the backend terminal."
        return f"AI Agent Error: {str(e)}"
