export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type AgentRole = "researcher" | "critic" | "synthesizer";

export type AgentStatus = "idle" | "working" | "completed" | "error";

export interface AgentNodeState {
  id: AgentRole;
  label: string;
  role: AgentRole;
  status: AgentStatus;
  progress: number; // 0 to 100
  title: string;
  output: string;
  x: number; // Position on infinite canvas
  y: number;
}

export interface ResearchSession {
  id: string;
  query: string;
  timestamp: string;
  researcherOutput: string;
  criticOutput: string;
  synthesizerOutput: string;
  finalReport: string;
}

// WebSocket Message Types
export type ClientMessageType = "start_research" | "cancel_research";

export interface ClientMessage {
  type: ClientMessageType;
  payload: {
    query?: string;
    sessionId?: string;
  };
}

export interface ServerMessage {
  type: "status" | "node_start" | "node_chunk" | "node_complete" | "error";
  payload: {
    nodeId?: AgentRole;
    status?: ConnectionStatus | AgentStatus;
    chunk?: string;
    fullText?: string;
    error?: string;
    progress?: number;
    title?: string;
  };
}
