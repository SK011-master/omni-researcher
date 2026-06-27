import os
from dotenv import load_dotenv
from typing import Literal
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from google import genai

# Load the API key from your .env file
load_dotenv()

# Initialize the new Google GenAI Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash" # Fast and cost-effective for multi-agent loops

# ==========================================
# 1. DEFINE THE AGENTS (NODES)
# ==========================================

def researcher_node(state: AgentState):
    print("🧠 [RESEARCHER] Gathering data...")
    task = state.get("task", "")
    feedback = state.get("critic_feedback", "")
    
    # If the critic rejected the last attempt, append the feedback
    prompt = f"You are a Senior Researcher. Task: {task}."
    if feedback:
        prompt += f"\nCritique from your manager: {feedback}. Improve your research based on this."
        
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    
    # Append new research to our shared state list
    current_data = state.get("research_data", [])
    current_data.append(response.text)
    
    return {"research_data": current_data, "current_agent": "researcher"}

def critic_node(state: AgentState):
    print("🧐 [CRITIC] Reviewing research...")
    data = state.get("research_data", [])[-1] if state.get("research_data") else ""
    task = state.get("task", "")
    current_count = state.get("revision_count", 0)
    
    prompt = f"""
    You are a strict QA Manager. 
    Original Task: {task}
    Provided Research: {data}
    
    Does the research fully and accurately answer the task? 
    If YES, respond with exactly the word: APPROVED.
    If NO, provide a 1-sentence critique on what is missing.
    """
    
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    
    return {
        "critic_feedback": response.text.strip(), 
        "revision_count": current_count + 1,
        "current_agent": "critic"
    }

def synthesizer_node(state: AgentState):
    print("✍️ [SYNTHESIZER] Formatting final report...")
    all_data = "\n\n".join(state.get("research_data", []))
    task = state.get("task", "")
    
    prompt = f"Task: {task}\nRaw Data:\n{all_data}\n\nFormat this into a highly professional, well-structured Markdown report."
    
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    
    return {"final_report": response.text, "current_agent": "synthesizer"}

# ==========================================
# 2. DEFINE THE ROUTING LOGIC (CONDITIONAL EDGES)
# ==========================================

def router(state: AgentState) -> Literal["researcher_node", "synthesizer_node"]:
    feedback = state.get("critic_feedback", "")
    count = state.get("revision_count", 0)
    
    print(f"   -> Critic Feedback: {feedback}")
    
    # If approved OR if we looped 2 times (to prevent infinite expensive loops)
    if "APPROVED" in feedback.upper() or count >= 2:
        print("   -> Routing to SYNTHESIZER")
        return "synthesizer_node"
    
    print("   -> Routing back to RESEARCHER")
    return "researcher_node"

# ==========================================
# 3. BUILD AND COMPILE THE GRAPH
# ==========================================

workflow = StateGraph(AgentState)

# Add our nodes
workflow.add_node("researcher_node", researcher_node)
workflow.add_node("critic_node", critic_node)
workflow.add_node("synthesizer_node", synthesizer_node)

# Set the starting point
workflow.set_entry_point("researcher_node")

# Connect Researcher to Critic
workflow.add_edge("researcher_node", "critic_node")

# Connect Critic to the Router (Conditional)
workflow.add_conditional_edges(
    "critic_node",
    router
)

# Connect Synthesizer to the End
workflow.add_edge("synthesizer_node", END)

# Compile into a runnable application
agent_app = workflow.compile()