import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Move, Layers, RefreshCw, Compass, Clock, CheckSquare, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { AgentRole, AgentNodeState, ConnectionStatus } from "../types";
import AgentNode from "./AgentNode";
import ToolNode from "./ToolNode";
import DatabaseNode, { DBStatus } from "./DatabaseNode";
import MarkdownViewer from "./MarkdownViewer";
import CommandTerminal from "./CommandTerminal";
import AnimatedEdge from "./AnimatedEdge";

interface WorkspaceProps {
  connectionStatus: ConnectionStatus;
  nodes: Record<AgentRole, AgentNodeState>;
  currentNode: AgentRole | null;
  streamedContent: string;
  activeQuery: string;
  error: string | null;
  isWebSearchActive: boolean;
  dbStatus: DBStatus;
  savedSessions: any[];
  fetchSavedSessions: () => void;
  startResearch: (query: string) => void;
  cancelResearch: () => void;
  resetSession: () => void;
}

export default function Workspace({
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
}: WorkspaceProps) {
  // Toggle between automatic streaming tracking or manual inspection
  const [selectedRole, setSelectedRole] = useState<AgentRole | "final" | "history">("final");
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isResetting, setIsResetting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [nodePositions, setNodePositions] = useState({
    researcher: { x: 50, y: 70 },
    critic: { x: 380, y: 70 },
    synthesizer: { x: 710, y: 70 },
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "output">("graph");
 
  const [nodeHeights, setNodeHeights] = useState({
    researcher: 220,
    critic: 220,
    synthesizer: 220,
  });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setNodeHeights((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        for (const entry of entries) {
          const id = entry.target.id;
          const height = (entry.target as HTMLElement).offsetHeight;
          if (id === "node-researcher" && next.researcher !== height) {
            next.researcher = height;
            hasChanges = true;
          } else if (id === "node-critic" && next.critic !== height) {
            next.critic = height;
            hasChanges = true;
          } else if (id === "node-synthesizer" && next.synthesizer !== height) {
            next.synthesizer = height;
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    });

    const r = document.getElementById("node-researcher");
    const c = document.getElementById("node-critic");
    const s = document.getElementById("node-synthesizer");
    if (r) observer.observe(r);
    if (c) observer.observe(c);
    if (s) observer.observe(s);

    return () => observer.disconnect();
  }, []);

  // Track active and previous agent nodes for state mapping flow animation
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [previousAgent, setPreviousAgent] = useState<string | null>(null);

  useEffect(() => {
    if (currentNode) {
      const mapped = `${currentNode}_node`;
      setActiveAgent((prev) => {
        if (prev && prev !== mapped) {
          setPreviousAgent(prev);
        }
        return mapped;
      });
    } else {
      // ADD THIS ELSE BLOCK: Turn off all glowing edges when done
      setActiveAgent(null);
      setPreviousAgent(null);
    }
  }, [currentNode]);

  // Reset agent history on a brand new run start
  useEffect(() => {
    if (
      nodes.researcher.status === "working" &&
      nodes.critic.status === "idle" &&
      nodes.synthesizer.status === "idle"
    ) {
      setPreviousAgent(null);
      setActiveAgent("researcher_node");
    }
  }, [nodes.researcher.status, nodes.critic.status, nodes.synthesizer.status]);

  const [isVerticalLayout, setIsVerticalLayout] = useState(false);
  const lastVerticalRef = useRef<boolean | null>(null);

  // Monitor canvas resizing to automatically adjust zoom/scale, centering, and layout direction perfectly
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0) continue; // Ignore initial 0-width states before layout finishes

        const vertical = width < 768;
        const layoutChanged = lastVerticalRef.current !== vertical;
        setIsVerticalLayout(vertical);

        let computedZoom = 1;
        if (vertical) {
          computedZoom = Math.max(0.65, Math.min(1, width / 480));
        } else if (width < 1024) {
          computedZoom = width / 1050;
        }
        setZoom(computedZoom);

        // Only auto-center on first load or when changing between vertical and horizontal layouts
        if (layoutChanged) {
          lastVerticalRef.current = vertical;
          const containerHeight = height || 500;
          
          if (vertical) {
            setCanvasOffset({
              x: (width / 2) - (550 * computedZoom),
              y: 20,
            });
          } else {
            setCanvasOffset({
              x: (width / 2) - (508 * computedZoom),
              y: Math.max(20, (containerHeight / 2) - (180 * computedZoom)),
            });
          }
        }
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);



  // Smooth custom pointer-drag handling for canvas panning (panning infinite background)
  const startPan = (e: React.PointerEvent) => {
    // Avoid panning if clicking inside node card or interactable buttons
    const target = e.target as HTMLElement;
    if (target.closest("[id^='node-']") || target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
      return;
    }

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffset = canvasOffset;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setCanvasOffset({
        x: initialOffset.x + dx,
        y: initialOffset.y + dy,
      });
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  // Monitor node activation to auto-switch focus
  useEffect(() => {
    if (currentNode) {
      setSelectedRole(currentNode);
      setActiveTab("output");
    } else if (nodes.synthesizer.output) {
      setSelectedRole("final");
      setActiveTab("output");
    }
  }, [currentNode, nodes.synthesizer.output]);

  const handleViewOutput = (role: AgentRole) => {
    setSelectedRole(role);
    setActiveTab("output");
  };

  const handleResetCanvas = () => {
    setCanvasOffset({ x: 0, y: 0 });
    if (isVerticalLayout) {
      setNodePositions({
        researcher: { x: 422, y: 20 },
        critic: { x: 422, y: 290 },
        synthesizer: { x: 422, y: 560 },
      });
    } else {
      setZoom(1);
      setNodePositions({
        researcher: { x: 50, y: 70 },
        critic: { x: 380, y: 70 },
        synthesizer: { x: 710, y: 70 },
      });
    }
  };

  const activeAgentNode = currentNode ? nodes[currentNode] : null;
  
  // Decide what markdown text to show
  let displayedMarkdown = "";
  let displayedTitle = "Report Output";
  
  if (selectedRole === "history") {
    displayedMarkdown = selectedHistorySession?.final_report || "";
    displayedTitle = selectedHistorySession ? `History: ${selectedHistorySession.task}` : "Research History";
  } else if (selectedRole === "final") {
    displayedMarkdown = nodes.synthesizer.output || nodes.critic.output || nodes.researcher.output || "";
    displayedTitle = nodes.synthesizer.output ? "Final Synthesized Report" : "Consolidated Output";
  } else {
    displayedMarkdown = nodes[selectedRole].output || "";
    displayedTitle = nodes[selectedRole].label;
  }

  const isProcessing = Object.values(nodes).some((n) => n.status === "working");

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* Top Navigation */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-900 bg-zinc-950 px-4 md:px-6 shrink-0 z-30">
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Logo */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            <Compass className="h-4.5 w-4.5 text-white animate-spin-slow" />
          </div>
          <div>
            <span className="font-sans font-extrabold text-xs md:text-sm tracking-tight text-white">
              OMNI-RESEARCHER
            </span>
            <span className="ml-1.5 md:ml-2 font-mono text-[8px] md:text-[9px] text-zinc-500 tracking-wider font-semibold border border-zinc-800 px-1 md:px-1.5 py-0.5 rounded bg-zinc-900/40">
              v2.5 ALPHA
            </span>
          </div>
        </div>

        {/* Quick Statistics or status panel */}
        <div className="flex items-center space-x-2.5 md:space-x-6">
          <div className="hidden sm:flex items-center space-x-3 md:space-x-4 font-mono text-[9px] md:text-[10px] text-zinc-500">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-600" />
              <span>Session: <strong className="text-zinc-400">{activeQuery ? "Active" : "Idle"}</strong></span>
            </div>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center space-x-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-zinc-600" />
              <span>Orchestrated Nodes: <strong className="text-zinc-400">3</strong></span>
            </div>
          </div>
          
          <button
            onClick={handleResetCanvas}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 px-2 md:px-3 py-1.5 font-mono text-[9px] md:text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition"
            title="Recenter Workspace Grid"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden xs:inline sm:inline md:inline">Recenter View</span>
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Tab Selector */}
      <div className="flex lg:hidden bg-zinc-950 border-b border-zinc-900 px-4 py-2 shrink-0 z-20">
        <div className="flex w-full bg-zinc-900/40 p-1 rounded-xl border border-zinc-800/60">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === "graph"
                ? "bg-zinc-900 text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-zinc-800"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Agent Graph</span>
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === "output"
                ? "bg-zinc-900 text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-zinc-800"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Output View</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Canvas & Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Infinite Canvas (Interactive Grid Stage) */}
        <div 
          ref={containerRef} 
          onPointerDown={startPan}
          className={`flex-1 relative overflow-hidden bg-zinc-950 select-none cursor-grab active:cursor-grabbing ${
            isMaximized ? "hidden" : (activeTab === "graph" ? "block" : "hidden lg:block")
          }`}
        >
          
          {/* Interactive Technical dotted background */}
          <div 
            className="absolute inset-0 bg-zinc-950 grid-bg pointer-events-none transition-transform duration-75"
            style={{
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
            }}
          />

          {/* Draggable Viewport Canvas Wrapper */}
          <div
            className="absolute inset-0 origin-top-left"
            style={{ 
              transform: `translate3d(${canvasOffset.x}px, ${canvasOffset.y}px, 0) scale(${zoom})` 
            }}
          >
            {/* Draggable Area - Size is large enough to feel infinite */}
            <div className={`relative ${isVerticalLayout ? "w-[1100px] h-[850px]" : "w-[1350px] h-[500px]"}`}>
              
              {/* SVG Connector Wires with pulsating glowing animations */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* Defs for gradients/glows */}
                <defs>
                  <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                 {isVerticalLayout ? (
                  <>
                    {/* Forward Edge 1: Researcher -> Critic (Vertical) */}
                    <AnimatedEdge
                      id="edge-researcher-critic"
                      pathD={`M ${nodePositions.researcher.x + 128} ${nodePositions.researcher.y + nodeHeights.researcher} L ${nodePositions.critic.x + 128} ${nodePositions.critic.y}`}
                      isActive={previousAgent === "researcher_node" && activeAgent === "critic_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Forward Edge 2: Critic -> Synthesizer (Vertical) */}
                    <AnimatedEdge
                      id="edge-critic-synthesizer"
                      pathD={`M ${nodePositions.critic.x + 128} ${nodePositions.critic.y + nodeHeights.critic} L ${nodePositions.synthesizer.x + 128} ${nodePositions.synthesizer.y}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "synthesizer_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Cyclic Backward Edge: Critic -> Researcher (Vertical Loop Left) */}
                    <AnimatedEdge
                      id="edge-critic-researcher-cyclic"
                      pathD={`M ${nodePositions.critic.x} ${nodePositions.critic.y + 110} H ${nodePositions.critic.x - 80} V ${nodePositions.researcher.y + 110} H ${nodePositions.researcher.x}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "researcher_node"}
                      color="#ef4444"
                      flowDirection="forward"
                    />
                  </>
                ) : (
                  <>
                    {/* Forward Edge 1: Researcher -> Critic */}
                    <AnimatedEdge
                      id="edge-researcher-critic"
                      pathD={`M ${nodePositions.researcher.x + 256} ${nodePositions.researcher.y + 110} L ${nodePositions.critic.x} ${nodePositions.critic.y + 110}`}
                      isActive={previousAgent === "researcher_node" && activeAgent === "critic_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Forward Edge 2: Critic -> Synthesizer */}
                    <AnimatedEdge
                      id="edge-critic-synthesizer"
                      pathD={`M ${nodePositions.critic.x + 256} ${nodePositions.critic.y + 110} L ${nodePositions.synthesizer.x} ${nodePositions.synthesizer.y + 110}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "synthesizer_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Cyclic Backward Edge: Critic -> Researcher */}
                    <AnimatedEdge
                      id="edge-critic-researcher-cyclic"
                      pathD={`M ${nodePositions.critic.x + 128} ${nodePositions.critic.y + nodeHeights.critic} V ${Math.max(nodePositions.critic.y + nodeHeights.critic, nodePositions.researcher.y + nodeHeights.researcher) + 40} H ${nodePositions.researcher.x + 128} V ${nodePositions.researcher.y + nodeHeights.researcher}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "researcher_node"}
                      color="#ef4444"
                      flowDirection="forward"
                    />
                  </>
                )}

                {/* Satellite Tool Edge: Google Search Tool -> Deep Researcher */}
                <AnimatedEdge
                  id="edge-tool-researcher"
                  pathD={`M ${nodePositions.researcher.x + 128} ${nodePositions.researcher.y - 150 + 104} L ${nodePositions.researcher.x + 128} ${nodePositions.researcher.y}`}
                  isActive={isWebSearchActive}
                  color="#0ea5e9"
                  flowDirection="forward"
                />

                {/* Database Edge: Synthesizer -> PostgreSQL Database */}
                <AnimatedEdge
                  id="edge-synthesizer-database"
                  pathD={`M ${nodePositions.synthesizer.x + 256} ${nodePositions.synthesizer.y + 110} L ${nodePositions.synthesizer.x + 350} ${nodePositions.synthesizer.y + 110}`}
                  isActive={dbStatus === "saving"}
                  color="#10b981"
                  flowDirection="forward"
                />
              </svg>

              {/* Tool Node: Google Search Tool */}
              <div
                className="absolute z-10 select-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  transform: `translate3d(${nodePositions.researcher.x + 16}px, ${nodePositions.researcher.y - 150}px, 0)` 
                }}
              >
                <ToolNode isActive={isWebSearchActive} />
              </div>

              {/* Database Node: PostgreSQL Persistent Storage */}
              <div
                className="absolute z-10 select-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  transform: `translate3d(${nodePositions.synthesizer.x + 350}px, ${nodePositions.synthesizer.y + 55}px, 0)` 
                }}
              >
                <DatabaseNode dbStatus={dbStatus} />
              </div>

              <div
                className="absolute z-10 select-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  transform: `translate3d(${nodePositions.researcher.x}px, ${nodePositions.researcher.y}px, 0)` 
                }}
              >
                <AgentNode
                  node={nodes.researcher}
                  isActive={currentNode === "researcher"}
                  onViewOutput={handleViewOutput}
                />
              </div>

              <div
                className="absolute z-10 select-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  transform: `translate3d(${nodePositions.critic.x}px, ${nodePositions.critic.y}px, 0)` 
                }}
              >
                <AgentNode
                  node={nodes.critic}
                  isActive={currentNode === "critic"}
                  onViewOutput={handleViewOutput}
                />
              </div>

              <div
                className="absolute z-10 select-none"
                style={{ 
                  left: 0, 
                  top: 0, 
                  transform: `translate3d(${nodePositions.synthesizer.x}px, ${nodePositions.synthesizer.y}px, 0)` 
                }}
              >
                <AgentNode
                  node={nodes.synthesizer}
                  isActive={currentNode === "synthesizer"}
                  onViewOutput={handleViewOutput}
                />
              </div>

            </div>
          </div>

          {/* Canvas Navigation & Zoom controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto flex flex-col sm:flex-row items-center gap-2 sm:space-x-4 bg-zinc-950/85 border border-zinc-900/80 px-3 py-2 sm:px-3.5 rounded-xl backdrop-blur-md z-20 shadow-lg">
            <div className="flex items-center space-x-1.5 font-mono text-[8px] sm:text-[9px] text-zinc-400 text-center sm:text-left">
              <Move className="h-3.5 w-3.5 text-zinc-500 shrink-0 animate-pulse" />
              <span>DRAG BACKGROUND TO PAN</span>
            </div>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <div className="flex items-center space-x-2 font-mono">
              <button
                onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] text-zinc-300 font-bold select-none min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((prev) => Math.min(1.5, prev + 0.1))}
                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetCanvas}
                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition ml-1"
                title="Reset View & Zoom"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Sophisticated Markdown Preview Drawer */}
        <div 
          className={`w-full ${isMaximized ? "lg:w-full" : "lg:w-[480px] xl:w-[560px]"} border-t lg:border-t-0 lg:border-l border-zinc-900 bg-zinc-950 flex flex-col overflow-hidden z-20 ${
            isMaximized ? "block" : (activeTab === "output" ? "block" : "hidden lg:block")
          }`}
        >
          
          {/* Drawer tabs for preview selection */}
          <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950 px-4 py-2 shrink-0 select-none">
            <div className="flex flex-1 gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedRole("final")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition min-w-[90px] ${
                  selectedRole === "final"
                    ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Synthesis
              </button>
              <button
                onClick={() => setSelectedRole("researcher")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition min-w-[90px] ${
                  selectedRole === "researcher"
                    ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Researcher
              </button>
              <button
                onClick={() => setSelectedRole("critic")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition min-w-[90px] ${
                  selectedRole === "critic"
                    ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Critique
              </button>
              <button
                onClick={() => {
                  setSelectedRole("history");
                  setSelectedHistorySession(null);
                }}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition min-w-[110px] ${
                  selectedRole === "history"
                    ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                History
              </button>
            </div>

            {/* Maximize/Minimize toggle button */}
            <div className="flex items-center pl-3 ml-2 border-l border-zinc-900 shrink-0">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title={isMaximized ? "Minimize Panel" : "Maximize Panel"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Markdown / History Content Block */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {selectedRole === "history" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedHistorySession ? (
                  /* B. Detail Inspection View */
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="mb-4 shrink-0">
                      <button
                        onClick={() => setSelectedHistorySession(null)}
                        className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700"
                      >
                        <span>← Back to Sessions</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden pr-1 pb-2"> 
                      <MarkdownViewer
                        content={selectedHistorySession.final_report}
                        isStreaming={false}
                        agentName={`History Session: ${selectedHistorySession.task}`}
                      />
                    </div>
                  </div>
                ) : (
                  /* A. List View (Default) */
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900 shrink-0">
                      <h3 className="font-mono text-xs font-bold text-zinc-400 tracking-wider uppercase">
                        Saved Research Logs ({savedSessions.length})
                      </h3>
                      <button
                        onClick={fetchSavedSessions}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                        title="Reload History"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {savedSessions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 bg-zinc-900/10 rounded-xl border border-dashed border-zinc-900">
                        <Clock className="h-8 w-8 text-zinc-600 mb-2 animate-pulse" />
                        <p className="font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-400">No logs found</p>
                        <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                          Complete a deep research session to automatically persist reports in PostgreSQL database storage.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-4">
                        {savedSessions.map((session) => {
                          const formattedDate = new Date(session.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          
                          return (
                            <motion.div
                              key={session.id}
                              whileHover={{ y: -2 }}
                              onClick={() => setSelectedHistorySession(session)}
                              className="group relative cursor-pointer p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300"
                            >
                              {/* Background ambient gradient glow on hover */}
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                              
                              <div className="relative z-10 flex flex-col space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider">
                                  <span className="text-blue-400 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">
                                    {session.id}
                                  </span>
                                  <span className="text-zinc-500">
                                    {formattedDate}
                                  </span>
                                </div>
                                
                                <p className="text-xs font-medium text-zinc-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                                  {session.task}
                                </p>
                                
                                <div className="flex items-center justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest space-x-1">
                                  <span>Inspect dossier</span>
                                  <span>→</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Original Markdown Content Panel */
              <MarkdownViewer
                content={displayedMarkdown}
                isStreaming={isProcessing && selectedRole === currentNode}
                agentName={displayedTitle}
              />
            )}
          </div>

        </div>
      </div>

      {/* Error HUD */}
      {error && (
        <div className="bg-rose-500/10 border-y border-rose-500/20 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row gap-2 items-center justify-between shrink-0 text-center sm:text-left">
          <p className="text-xs font-medium text-rose-400 font-mono">
            CRITICAL ERROR: {error}
          </p>
          <button
            onClick={resetSession}
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 hover:text-white"
          >
            Wipe State
          </button>
        </div>
      )}

      {/* Bottom Command Center */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 sm:px-6 py-2 md:py-4 shrink-0 z-30">
        <CommandTerminal
          connectionStatus={connectionStatus}
          onSubmit={startResearch}
          onCancel={cancelResearch}
          onReset={resetSession}
          isProcessing={isProcessing}
          activeQuery={activeQuery}
        />
      </footer>
    </div>
  );
}
