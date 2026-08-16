from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.graph import build_graph

app = FastAPI(title="AI Research Agent")

# Allow the Next.js frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default dev port
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()

class ResearchRequest(BaseModel):
    topic: str
    recipient_email: str | None = None

@app.post("/research")
def run_research(request: ResearchRequest):
    result = graph.invoke({
        "topic": request.topic,
        "recipient_email": request.recipient_email
    })
    return {
        "topic": result["topic"],
        "summary": result["summary"],
        "email_sent": result["email_sent"]
    }

@app.get("/")
def health_check():
    return {"status": "AI Research Agent is running"}

from fastapi import WebSocket, WebSocketDisconnect
import asyncio
from agents.graph import build_graph, search_node, summarize_node, email_node

@app.websocket("/ws/research")
async def websocket_research(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        topic = data.get("topic")
        recipient_email = data.get("recipient_email")

        await websocket.send_json({"status": "searching", "message": f"Searching for '{topic}'..."})
        state = search_node({"topic": topic, "recipient_email": recipient_email})

        await websocket.send_json({"status": "summarizing", "message": "Summarizing results..."})
        state = summarize_node(state)

        await websocket.send_json({"status": "emailing", "message": "Sending email..."})
        state = email_node(state)

        await websocket.send_json({
            "status": "done",
            "summary": state["summary"],
            "email_sent": state["email_sent"]
        })

    except WebSocketDisconnect:
        print("Client disconnected")