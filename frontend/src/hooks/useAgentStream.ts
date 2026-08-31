import { useState, useRef, useCallback, useEffect } from 'react';
import { AgentRole, AgentNodeState, ConnectionStatus } from '../types';

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

// Use environment variables for deployment flexibility
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

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

  const wsRef = useRef<WebSocket | null>(null);

  // Sync isWebSearchActive with researcher status
  useEffect(() => {
    setIsWebSearchActive(nodes.researcher.status === 'working');
  }, [nodes.researcher.status]);

  // Fetch saved sessions filtered by the user's Client ID
  const fetchSavedSessions = useCallback(async () => {
    try {
      const clientId = localStorage.getItem('omni_client_id');
      if (!clientId) return;

      const response = await fetch(`${API_BASE_URL}/api/sessions?client_id=${encodeURIComponent(clientId)}`);
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

  // WebSocket Connection Initializer
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus('connecting');
    const ws = new WebSocket(`${WS_BASE_URL}/ws/chat`);

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
      setError('Connection to backend lost.');
    };

    wsRef.current = ws;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const startResearch = useCallback((query: string) => {
    const apiKey = localStorage.getItem('omni_gemini_key') || '';
    const clientId = localStorage.getItem('omni_client_id') || '';

    if (!apiKey) {
      setError('Missing Gemini API Key. Please configure your key in workspace settings.');
      return;
    }

    const payload = JSON.stringify({
      task: query,
      api_key: apiKey,
      client_id: clientId,
    });

    setActiveQuery(query);
    setNodes(INITIAL_NODES);
    setCurrentNode('researcher');
    setError(null);

    setNodes(prev => ({
      ...prev,
      researcher: { ...prev.researcher, status: 'working', title: 'Gathering data...' }
    }));

    const setupMessageHandler = (socket: WebSocket) => {
      socket.onmessage = async (event) => {
        const response = JSON.parse(event.data);

        if (response.type === 'db_status') {
          setDbStatus(response.status);
          if (response.status === 'saved') {
            fetchSavedSessions();
          }
          return;
        }

        if (response.type === 'update') {
          const agentName = response.agent.replace('_node', '') as AgentRole;

          if (agentName === 'critic') {
            await new Promise(r => setTimeout(r, 1200));
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
            } else if (agentName === 'critic') {
              newNodes.researcher.status = 'completed';
              newNodes.critic.status = 'working';
              newNodes.synthesizer.status = 'idle';

              if (response.data.critic_feedback) {
                newNodes.critic.output = response.data.critic_feedback;
              }
            } else if (agentName === 'synthesizer') {
              newNodes.researcher.status = 'completed';
              newNodes.critic.status = 'completed';
              newNodes.synthesizer.status = 'working';

              if (response.data.final_report) {
                newNodes.synthesizer.output = response.data.final_report;
              }
            }

            return newNodes;
          });
        } else if (response.type === 'complete') {
          setNodes(prev => {
            const newNodes = { ...prev };
            if (newNodes.synthesizer.status === 'working') {
              newNodes.synthesizer.status = 'completed';
            }
            return newNodes;
          });
          setCurrentNode(null);
        } else if (response.type === 'error') {
          setError(response.message);
          setCurrentNode(null);
        }
      };
    };

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/chat`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(payload);
      };

      ws.onclose = () => setConnectionStatus('disconnected');
      setupMessageHandler(ws);
    } else {
      setupMessageHandler(wsRef.current);
      wsRef.current.send(payload);
    }
  }, [fetchSavedSessions]);

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