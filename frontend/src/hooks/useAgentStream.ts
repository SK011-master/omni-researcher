import { useState, useRef, useCallback, useEffect } from 'react';
import { AgentRole, AgentNodeState, ConnectionStatus } from '../types';

// Default initial state for your agent nodes
const INITIAL_NODES: Record<AgentRole, AgentNodeState> = {
  researcher: {
    id: 'researcher',
    role: 'researcher',
    label: 'Deep Researcher',
    title: 'Awaiting Query',
    status: 'idle',
    progress: 0,
    output: '',
    x: 150,
    y: 100,
  },
  critic: {
    id: 'critic',
    role: 'critic',
    label: 'Peer Reviewer',
    title: 'Awaiting Research',
    status: 'idle',
    progress: 0,
    output: '',
    x: 500,
    y: 100,
  },
  synthesizer: {
    id: 'synthesizer',
    role: 'synthesizer',
    label: 'Report Synthesizer',
    title: 'Awaiting Review',
    status: 'idle',
    progress: 0,
    output: '',
    x: 850,
    y: 100,
  },
};

export const useAgentStream = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [nodes, setNodes] = useState<Record<AgentRole, AgentNodeState>>(INITIAL_NODES);
  const [currentNode, setCurrentNode] = useState<AgentRole | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedSessions, setSavedSessions] = useState<any[]>([]);

  // Sync isWebSearchActive with researcher status
  useEffect(() => {
    if (nodes.researcher.status === 'working') {
      setIsWebSearchActive(true);
    } else {
      setIsWebSearchActive(false);
    }
  }, [nodes.researcher.status]);

  const fetchSavedSessions = useCallback(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/sessions'); 
        if (response.ok) {
          const data = await response.json();
          setSavedSessions(data);
        } else {
          console.error('Failed to fetch saved sessions:', response.statusText);
        }
      } catch (err) {
        console.error('Error fetching saved sessions:', err);
      }
  }, []);

  // Fetch saved sessions on mount
  useEffect(() => {
    fetchSavedSessions();
  }, [fetchSavedSessions]);

  // Handle connection/operational error
  useEffect(() => {
    if (error) {
      setDbStatus('error');
    }
  }, [error]);

  const wsRef = useRef<WebSocket | null>(null);

// Auto-connect to FastAPI on load
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket('ws://localhost:8000/ws/chat');

      wsRef.current.onopen = () => setConnectionStatus('connected');
      wsRef.current.onclose = () => setConnectionStatus('disconnected');
    }
  }, []);

  const startResearch = useCallback((query: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
       // Reconnect if disconnected
       wsRef.current = new WebSocket('ws://localhost:8000/ws/chat');
    }
    
    setActiveQuery(query);
    setNodes(INITIAL_NODES); // Reset nodes
    setCurrentNode('researcher');
    setError(null);

    // Update Researcher status to working
    setNodes(prev => ({
      ...prev,
      researcher: { ...prev.researcher, status: 'working', title: 'Gathering data...' }
    }));

    // Send the task to Python LangGraph!
    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({ task: query }));
    };
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ task: query }));
    }

    // Listen for LangGraph responses
    wsRef.current.onmessage = async (event) => {
      const response = JSON.parse(event.data);

      // --- ADD THIS BLOCK TO CATCH DATABASE EVENTS FROM PYTHON ---
      if (response.type === 'db_status') {
        setDbStatus(response.status);
        if (response.status === 'saved') {
          fetchSavedSessions(); // Silently reload the history tab!
        }
        return; // Exit early since this isn't a node update
      }
      // -----------------------------------------------------------

      if (response.type === 'update') {
        const agentName = response.agent.replace('_node', '') as AgentRole;
        
        if (agentName === 'critic') {
          await new Promise(r => setTimeout(r, 1500));
        }

        setCurrentNode(agentName);
        
        setNodes(prev => {
          const newNodes = { ...prev };
          
          if (agentName === 'researcher') {
            newNodes.researcher.status = 'working';
            newNodes.critic.status = 'idle';
            newNodes.synthesizer.status = 'idle';
            
            const rData = response.data.research_data;
            if (rData) {
              newNodes.researcher.output = Array.isArray(rData) ? rData.join('\n\n') : String(rData);
            }
          }
          
          else if (agentName === 'critic') {
             newNodes.researcher.status = 'completed';
             newNodes.critic.status = 'working';
             newNodes.synthesizer.status = 'idle';
             
             if (response.data.critic_feedback) {
                 newNodes.critic.output = response.data.critic_feedback;
             }
          }

          else if (agentName === 'synthesizer') {
             newNodes.researcher.status = 'completed';
             newNodes.critic.status = 'completed';
             newNodes.synthesizer.status = 'working';
             
             if (response.data.final_report) {
                 newNodes.synthesizer.output = response.data.final_report;
             }
          }
          
          return newNodes;
        });
      } 
      else if (response.type === 'complete') {
        setNodes(prev => {
          const newNodes = { ...prev };
          if (newNodes.synthesizer.status === 'working') {
             newNodes.synthesizer.status = 'completed';
          }
          return newNodes;
        });
        setCurrentNode(null); // Triggers final UI state and stops animations
      } 
      else if (response.type === 'error') {
        setError(response.message);
        setCurrentNode(null);
      }
    };
  }, []);

  const cancelResearch = () => {
    if (wsRef.current) wsRef.current.close();
    setConnectionStatus('disconnected');
    setCurrentNode(null);
  };

  const resetSession = () => {
    setNodes(INITIAL_NODES);
    setCurrentNode(null);
    setActiveQuery("");
    setError(null);
  };

  return {
    connectionStatus,
    nodes,
    currentNode,
    streamedContent,
    activeQuery,
    error,
    isWebSearchActive,
    dbStatus,
    savedSessions,
    fetchSavedSessions,
    startResearch,
    cancelResearch,
    resetSession,
  };
};