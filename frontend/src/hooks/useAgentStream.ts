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
  },
  critic: {
    id: 'critic',
    role: 'critic',
    label: 'Peer Reviewer',
    title: 'Awaiting Research',
    status: 'idle',
    progress: 0,
    output: '',
  },
  synthesizer: {
    id: 'synthesizer',
    role: 'synthesizer',
    label: 'Report Synthesizer',
    title: 'Awaiting Review',
    status: 'idle',
    progress: 0,
    output: '',
  },
};

export const useAgentStream = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [nodes, setNodes] = useState<Record<AgentRole, AgentNodeState>>(INITIAL_NODES);
  const [currentNode, setCurrentNode] = useState<AgentRole | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

// Auto-connect to FastAPI on load
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket('ws://localhost:8000/ws/chat');

      wsRef.current.onopen = () => setConnectionStatus('connected');
      wsRef.current.onclose = () => setConnectionStatus('offline');
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
    wsRef.current.onmessage = (event) => {
      const response = JSON.parse(event.data);

      if (response.type === 'update') {
        const agentName = response.agent.replace('_node', '') as AgentRole;
        setCurrentNode(agentName);
        
        setNodes(prev => {
          const newNodes = { ...prev };
          
          // 1. When Researcher finishes, save its data and prep Critic
          if (agentName === 'researcher') {
            newNodes.researcher.status = 'completed';
            const rData = response.data.research_data;
            if (rData) {
              newNodes.researcher.output = Array.isArray(rData) ? rData.join('\n\n') : String(rData);
            }
            newNodes.critic.status = 'working';
            newNodes.critic.title = 'Reviewing findings...';
          }
          
          // 2. When Critic finishes, save its feedback and prep Synthesizer
          if (agentName === 'critic') {
             newNodes.critic.status = 'completed';
             if (response.data.critic_feedback) {
                 newNodes.critic.output = response.data.critic_feedback;
             }
             newNodes.synthesizer.status = 'working';
             newNodes.synthesizer.title = 'Formatting final report...';
          }

          // 3. When Synthesizer finishes, save final report
          if (agentName === 'synthesizer') {
             newNodes.synthesizer.status = 'completed';
             if (response.data.final_report) {
                 newNodes.synthesizer.output = response.data.final_report;
             }
          }
          return newNodes;
        });
      } 
      else if (response.type === 'complete') {
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
    setConnectionStatus('offline');
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
    startResearch,
    cancelResearch,
    resetSession,
  };
};