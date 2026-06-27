from app.agents.graph import agent_app

def main():
    # Initial state to start the graph
    initial_state = {
        "task": "Explain the difference between LangChain and LangGraph in 3 bullet points.",
        "research_data": [],
        "critic_feedback": "",
        "revision_count": 0,
        "final_report": "",
        "current_agent": "system"
    }
    
    print("\n🚀 Starting Multi-Agent Workflow...\n")
    
    # Run the graph
    result = agent_app.invoke(initial_state)
    
    print("\n✅ WORKFLOW COMPLETE. FINAL REPORT:\n")
    print(result["final_report"])

if __name__ == "__main__":
    main()