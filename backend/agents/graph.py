from tavily import TavilyClient
from config import settings

tavily_client = TavilyClient(api_key=settings.tavily_api_key)

def search_node(state: dict) -> dict:
    """Takes a topic from state, searches the web, returns results."""
    topic = state["topic"]
    
    results = tavily_client.search(
        query=topic,
        max_results=5,
        search_depth="basic"
    )
    
    # results["results"] is a list of dicts, each with 'title', 'url', 'content'
    state["search_results"] = results["results"]
    return state

from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",
    google_api_key=settings.gemini_api_key
)

def summarize_node(state: dict) -> dict:
    """Takes search results from state, asks Gemini to summarize them."""
    topic = state["topic"]
    results = state["search_results"]
    
    # Combine all search result content into one block of text
    combined_content = "\n\n".join(
        f"Source: {r['title']}\n{r['content']}" for r in results
    )
    
    prompt = f"""You are a research assistant. Summarize the following search results about "{topic}" into a clear, concise summary (3-5 paragraphs). Focus on the key facts and insights.

Search Results:
{combined_content}

Summary:"""
    
    response = llm.invoke(prompt)
    state["summary"] = response.content
    return state

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def email_node(state: dict) -> dict:
    """Takes the summary from state, emails it via Gmail SMTP."""
    topic = state["topic"]
    summary = state["summary"]
    recipient = state.get("recipient_email") or settings.email_address # default: email yourself

    msg = MIMEMultipart()
    msg["From"] = settings.email_address
    msg["To"] = recipient
    msg["Subject"] = f"Research Summary: {topic}"

    body = f"Here's your research summary on '{topic}':\n\n{summary}"
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(settings.email_address, settings.email_app_password)
        server.send_message(msg)

    state["email_sent"] = True
    return state

from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional

class AgentState(TypedDict):
    topic: str
    search_results: Optional[List[dict]]
    summary: Optional[str]
    recipient_email: Optional[str]
    email_sent: Optional[bool]

def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("search", search_node)
    graph.add_node("summarize", summarize_node)
    graph.add_node("email", email_node)

    graph.set_entry_point("search")
    graph.add_edge("search", "summarize")
    graph.add_edge("summarize", "email")
    graph.add_edge("email", END)

    return graph.compile()