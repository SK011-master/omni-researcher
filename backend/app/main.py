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
        while True: # <--- 1. ADD THIS INFINITE LOOP
            # 2. Indent everything below this point by one tab
            data = await websocket.receive_text()
            payload = json.loads(data)
            task = payload.get("task", "")

            initial_state = {
                "task": task,
                "research_data": [],
                "critic_feedback": "",
                "revision_count": 0,
                "final_report": "",
                "current_agent": "system",
                "is_searching": False
            }

            async for event in agent_app.astream(initial_state):
                for node_name, state_update in event.items():
                    # Clean up node name (e.g., "researcher_node" -> "researcher")
                    clean_name = node_name.replace('_node', '')
                    
                    # If the researcher node just fired, we can optimistically trigger the search stream 
                    # or read it straight out of the node's returned dictionary variables.
                    is_searching = state_update.get("is_searching", False)
                    
                    # If researcher node is starting up, send a preliminary "searching" pulse to the UI
                    if clean_name == "researcher":
                        await websocket.send_json({
                            "type": "update",
                            "agent": "researcher_node",
                            "data": {
                                **state_update,
                                "is_searching": True # Turn on the radar icon!
                            }
                        })
                        await asyncio.sleep(1.2) # Let the radar icon pulse cinematically

                    # Send the final node updates to the frontend client
                    await websocket.send_json({
                        "type": "update",
                        "agent": node_name,
                        "data": state_update # Turns off is_searching once the node finishes
                    })
                    await asyncio.sleep(0.5) 

            await websocket.send_json({"type": "complete", "message": "Workflow finished."})

    except WebSocketDisconnect:
        print("Frontend client disconnected.")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})