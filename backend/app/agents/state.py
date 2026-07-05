from typing import TypedDict, List

class AgentState(TypedDict):
    # The original objective or question provided by the user
    task: str
    
    # Collected raw research data
    research_data: List[str]
    
    # Feedback provided by the Critic agent
    critic_feedback: str
    
    # Number of verification iterations to prevent infinite loops
    revision_count: int
    
    # The final formatted report
    final_report: str
    
    # Internal log to keep track of which agent is currently active
    current_agent: str
    is_searching: bool