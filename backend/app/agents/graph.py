import os
from dotenv import load_dotenv
from typing import Literal
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from google import genai
from google.genai import types

# Load the API key from your .env file
load_dotenv()

# Initialize the new Google GenAI Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash" # Fast and cost-effective for multi-agent loops

# ==========================================
# 1. DEFINE THE AGENTS (NODES)
# ==========================================

def researcher_node(state: AgentState):
    print("🧠 [RESEARCHER] Gathering live data...")
    task = state.get("task", "")
    feedback = state.get("critic_feedback", "")
    
    # 1. First, instantly notify the frontend that web search is spinning up
    # By setting current_agent to "researcher" and is_searching to True, React lights up both nodes!
    
    # NOTE: If you are using standard LangGraph nodes, returning state modifies it. 
    # To stream real-time intermediate actions to a WebSocket endpoint, ensure your 
    # main router/loop handles parsing this flag.
    
    prompt = f"""You are a Senior Deep Researcher with live internet access. 
    Task: {task}.
    You MUST use the Google Search tool to find the most up-to-date, accurate, and concrete data to answer the task.
    """
    
    if feedback:
        prompt += f"\nCritique from your manager: {feedback}. Improve your research by finding better data."
        
    # 2. Run the tool-enabled execution loop
    response = client.models.generate_content(
        model=MODEL_ID, 
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[{"google_search": {}}],
        )
    )
    
    current_data = state.get("research_data", [])
    current_data.append(response.text)
    
    # 3. Turn off the web search flag now that the data has been retrieved
    return {
        "research_data": current_data, 
        "current_agent": "researcher",
        "is_searching": False
    }

def critic_node(state: AgentState):
    print("🧐 [CRITIC] Reviewing research...")
    data = state.get("research_data", [])[-1] if state.get("research_data") else ""
    task = state.get("task", "")
    current_count = state.get("revision_count", 0)
    
    prompt = f"""
    You are a ruthless, highly-analytical Peer Reviewer and QA Manager. 
    Original Task: {task}
    Provided Research: {data}
    
    STRICT EVALUATION CRITERIA:
    1. The research MUST contain concrete numerical data, metrics, or statistics to back up its claims.
    2. The research MUST directly answer the original task.
    
    Does the research meet ALL criteria? 
    If YES, respond with exactly the word: APPROVED.
    If NO, respond starting with the word REJECT followed by a 1-sentence critique on what is missing (e.g., "REJECT: The research lacks specific numerical statistics.").
    """
    
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    
    return {
        "critic_feedback": response.text.strip(), 
        "revision_count": current_count + 1,
        "current_agent": "critic"
    }

def synthesizer_node(state: AgentState):
    print("✍️ [SYNTHESIZER] Formatting final report with native widgets...")
    all_data = "\n\n".join(state.get("research_data", []))
    task = state.get("task", "")
    
    prompt = f"""
    Task: {task}
    Raw Data: {all_data}
    
    You are the system report synthesizer. Your job is to format the gathered research into a comprehensive, publication-ready Markdown report.
    
    CRITICAL STRUCTURE REQUIREMENT 1 - VISUAL INFOGRAPHICS:
    You must extract core quantitative findings and deliver them via functional structural widgets. Use the exact code-fence tags described below. Do not put any extra explanations or characters inside these code fences besides valid JSON.
    
    - To display high-level stats, use the `kpi-metrics` tag with a JSON array:
    ```kpi-metrics
    [
      {{"label": "REVENUE GROWTH", "value": "+45%", "subtext": "Q1 Year-over-Year acceleration"}}
    ]
    ```
    
    - To display trend metrics or comparisons over category data, use the `line-chart` tag with this exact object structural shape:
    ```line-chart
    {{
      "xAxis": "Timeline Metric (e.g. Quarter, Year, Version)",
      "yAxis": "Quantity Metric (e.g. Efficiency %, Latency ms)",
      "data": [
        {{"name": "Q1", "value": 120}},
        {{"name": "Q2", "value": 180}}
      ]
    }}
    ```

    CRITICAL STRUCTURE REQUIREMENT 2 - CONTEXTUAL IMAGES:
    You must intelligently include exactly two cinematic, highly relevant image break assets inside the report flow. 
    To create an image, construct a highly descriptive visual graphic generation prompt (e.g., "A modern solid state battery cell glowing under laboratory equipment, dark background, 8k resolution, cinematic lighting").
    Embed it into the text exactly using this Markdown template (replace all spaces in your prompt string with hyphens `-`):
    ![Alt Text Description](https://image.pollinations.ai/prompt/YOUR-DESCRIPTIVE-PROMPT-HERE-WITH-HYPHENS)
    
    Ensure the remaining report narrative utilizes clean formatting headers (##, ###) and clear structural bullet lists.
    """
    
    # Assuming you are using the Google GenAI SDK client architecture
    response = client.models.generate_content(model=MODEL_ID, contents=prompt)
    
    return {"final_report": response.text, "current_agent": "synthesizer"}

# ==========================================
# 2. DEFINE THE ROUTING LOGIC (CONDITIONAL EDGES)
# ==========================================

def router(state: AgentState) -> Literal["researcher_node", "synthesizer_node"]:
    feedback = state.get("critic_feedback", "")
    revision_count = state.get("revision_count", 0)
    
    print(f"   -> Critic Feedback: {feedback}")
    
    # If approved OR we've looped too many times (e.g., max 3 loops to prevent infinite loops)
    if feedback.startswith("APPROVED") or revision_count >= 3:
        print("   -> Routing to SYNTHESIZER")
        return "synthesizer_node"
    else:
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