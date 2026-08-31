from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from app.agents.graph import agent_app

# --- ADD DATABASE IMPORTS ---
from app.database import engine, Base, SessionLocal, get_db
from app.models import ResearchSession
from sqlalchemy.orm import Session


Base.metadata.create_all(bind=engine)

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

# --- REST ENDPOINT: Fetch History for the Frontend Drawer ---
@app.get("/api/sessions")
def get_sessions(client_id: str | None = None, db: Session = Depends(get_db)):
    # If a client_id is provided, try to fetch their specific sessions first
    sessions = []
    if client_id:
        sessions = db.query(ResearchSession).filter(ResearchSession.client_id == client_id).order_by(ResearchSession.created_at.desc()).all()
    
    # Fallback: If no sessions found for this specific anonymous client, 
    if not sessions:
        sessions = db.query(ResearchSession).order_by(ResearchSession.created_at.desc()).limit(10).all()
        
    return sessions

@app.get("/")
def read_root():
    return {"status": "Omni-Researcher Core is Online"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    db: Session = SessionLocal() # Open a fresh DB transaction session
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            # Extract the new variables from the frontend payload
            task = payload.get("task", "")
            user_api_key = payload.get("api_key", "")
            client_id = payload.get("client_id", "")

            # 1. Notify frontend that the DB pipeline is ready
            await websocket.send_json({
                "type": "db_status",
                "status": "idle",
                "message": "Database pipeline active."
            })

            initial_state = {
                "task": task,
                "api_key": user_api_key,
                "research_data": [],
                "critic_feedback": "",
                "revision_count": 0,
                "final_report": "",
                "current_agent": "system",
                "is_searching": False
            }
            
            # Keep a local tracker of the state to save to the database later
            final_state = initial_state.copy()

            async for event in agent_app.astream(initial_state):
                for node_name, state_update in event.items():
                    final_state.update(state_update) # Update our tracker
                    
                    clean_name = node_name.replace('_node', '')
                    is_searching = state_update.get("is_searching", False)
                    
                    if clean_name == "researcher":
                        await websocket.send_json({
                            "type": "update",
                            "agent": "researcher_node",
                            "data": {
                                **state_update,
                                "is_searching": True 
                            }
                        })
                        await asyncio.sleep(1.2)

                    await websocket.send_json({
                        "type": "update",
                        "agent": node_name,
                        "data": state_update 
                    })
                    await asyncio.sleep(0.5) 

            # 2. GRAPH IS COMPLETE -> Save everything to Supabase automatically!
            await websocket.send_json({
                "type": "db_status",
                "status": "saving",
                "message": "Writing final synthesis to Supabase..."
            })
            await asyncio.sleep(1.0) # Cinematic pause for visual effect

            try:
                new_session = ResearchSession(
                    client_id=client_id,
                    task=task,
                    research_data="|||".join(final_state.get("research_data", [])),
                    final_report=final_state.get("final_report", "")
                )
                db.add(new_session)
                db.commit()
                db.refresh(new_session)

                # 3. Notify frontend of successful persistence
                await websocket.send_json({
                    "type": "db_status",
                    "status": "saved",
                    "message": f"Session secured safely in cloud."
                })
            except Exception as db_err:
                db.rollback()
                print(f"Database Save Error: {db_err}")
                await websocket.send_json({
                    "type": "db_status",
                    "status": "error",
                    "message": "Failed to save session to database."
                })

            await websocket.send_json({"type": "complete", "message": "Workflow finished."})

    except WebSocketDisconnect:
        print("Frontend client disconnected.")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        db.close() # Always close the connection pipeline