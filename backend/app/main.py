from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from app.agents.graph import agent_app

# Initialize the API
app = FastAPI(title="Omni-Researcher API")

# Configure CORS so your React frontend can communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, we will restrict this to your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Omni-Researcher Core is Online"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # 1. Receive the initial prompt from the React frontend
        data = await websocket.receive_text()
        payload = json.loads(data)
        task = payload.get("task", "")

        initial_state = {
            "task": task,
            "research_data": [],
            "critic_feedback": "",
            "revision_count": 0,
            "final_report": "",
            "current_agent": "system"
        }

        # 2. Run the LangGraph workflow asynchronously
        # astream() yields events dynamically as each agent finishes its node
        async for event in agent_app.astream(initial_state):
            # 'event' is a dictionary containing the node name and its state updates
            for node_name, state_update in event.items():
                
                # 3. Stream the update directly to the frontend
                await websocket.send_json({
                    "type": "update",
                    "agent": node_name,
                    "data": state_update
                })
                
                # Add a tiny delay to ensure frontend animations have time to trigger smoothly
                await asyncio.sleep(0.5) 

        # 4. Notify the frontend that the workflow is done
        await websocket.send_json({"type": "complete", "message": "Workflow finished."})

    except WebSocketDisconnect:
        print("Frontend client disconnected.")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})