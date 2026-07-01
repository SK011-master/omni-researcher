import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Move, Layers, RefreshCw, Compass, Clock, CheckSquare, ZoomIn, ZoomOut } from "lucide-react";
import { AgentRole, AgentNodeState, ConnectionStatus } from "../types";
import AgentNode from "./AgentNode";
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
  startResearch,
  cancelResearch,
  resetSession,
}: WorkspaceProps) {
  // Toggle between automatic streaming tracking or manual inspection
  const [selectedRole, setSelectedRole] = useState<AgentRole | "final">("final");
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
            setNodePositions({
              researcher: { x: 422, y: 20 },
              critic: { x: 422, y: 290 },
              synthesizer: { x: 422, y: 560 },
            });
          } else {
            setCanvasOffset({
              x: (width / 2) - (508 * computedZoom),
              y: Math.max(20, (containerHeight / 2) - (180 * computedZoom)),
            });
            setNodePositions({
              researcher: { x: 50, y: 70 },
              critic: { x: 380, y: 70 },
              synthesizer: { x: 710, y: 70 },
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

  // Smooth custom pointer-drag handling for nodes (supports mobile touch, tablets, and PC mouse)
  const startDrag = (e: React.PointerEvent, role: AgentRole) => {
    if (e.button !== 0) return; // Only drag with left click/primary contact
    e.stopPropagation(); // Stop background panning event from bubbling up
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = nodePositions[role];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Divide by zoom factor to keep drag speed matching pointer speed at any scale
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      setNodePositions((prev) => ({
        ...prev,
        [role]: {
          x: initialPos.x + dx,
          y: initialPos.y + dy,
        },
      }));
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

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
  
  if (selectedRole === "final") {
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
            activeTab === "graph" ? "block" : "hidden lg:block"
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
            <div className={`relative w-[1100px] ${isVerticalLayout ? "h-[850px]" : "h-[500px]"}`}>
              
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
                      pathD={`M ${nodePositions.researcher.x + 128} ${nodePositions.researcher.y + 200} C ${nodePositions.researcher.x + 128} ${(nodePositions.researcher.y + 200 + nodePositions.critic.y) / 2}, ${nodePositions.critic.x + 128} ${(nodePositions.researcher.y + 200 + nodePositions.critic.y) / 2}, ${nodePositions.critic.x + 128} ${nodePositions.critic.y}`}
                      isActive={previousAgent === "researcher_node" && activeAgent === "critic_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Forward Edge 2: Critic -> Synthesizer (Vertical) */}
                    <AnimatedEdge
                      id="edge-critic-synthesizer"
                      pathD={`M ${nodePositions.critic.x + 128} ${nodePositions.critic.y + 200} C ${nodePositions.critic.x + 128} ${(nodePositions.critic.y + 200 + nodePositions.synthesizer.y) / 2}, ${nodePositions.synthesizer.x + 128} ${(nodePositions.critic.y + 200 + nodePositions.synthesizer.y) / 2}, ${nodePositions.synthesizer.x + 128} ${nodePositions.synthesizer.y}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "synthesizer_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Cyclic Backward Edge: Critic -> Researcher (Vertical Loop Left) */}
                    <AnimatedEdge
                      id="edge-critic-researcher-cyclic"
                      pathD={`M ${nodePositions.critic.x} ${nodePositions.critic.y + 90} C ${nodePositions.critic.x - 160} ${nodePositions.critic.y + 90}, ${nodePositions.researcher.x - 160} ${nodePositions.researcher.y + 90}, ${nodePositions.researcher.x} ${nodePositions.researcher.y + 90}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "researcher_node"}
                      color="#ef4444"
                      flowDirection="backward"
                    />
                  </>
                ) : (
                  <>
                    {/* Forward Edge 1: Researcher -> Critic */}
                    <AnimatedEdge
                      id="edge-researcher-critic"
                      pathD={`M ${nodePositions.researcher.x + 256} ${nodePositions.researcher.y + 110} C ${(nodePositions.researcher.x + 256 + nodePositions.critic.x) / 2} ${nodePositions.researcher.y + 110}, ${(nodePositions.researcher.x + 256 + nodePositions.critic.x) / 2} ${nodePositions.critic.y + 110}, ${nodePositions.critic.x} ${nodePositions.critic.y + 110}`}
                      isActive={previousAgent === "researcher_node" && activeAgent === "critic_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Forward Edge 2: Critic -> Synthesizer */}
                    <AnimatedEdge
                      id="edge-critic-synthesizer"
                      pathD={`M ${nodePositions.critic.x + 256} ${nodePositions.critic.y + 110} C ${(nodePositions.critic.x + 256 + nodePositions.synthesizer.x) / 2} ${nodePositions.critic.y + 110}, ${(nodePositions.critic.x + 256 + nodePositions.synthesizer.x) / 2} ${nodePositions.synthesizer.y + 110}, ${nodePositions.synthesizer.x} ${nodePositions.synthesizer.y + 110}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "synthesizer_node"}
                      color="#3b82f6"
                      flowDirection="forward"
                    />

                    {/* Cyclic Backward Edge: Critic -> Researcher */}
                    <AnimatedEdge
                      id="edge-critic-researcher-cyclic"
                      pathD={`M ${nodePositions.critic.x + 128} ${nodePositions.critic.y + 220} Q ${(nodePositions.critic.x + nodePositions.researcher.x) / 2 + 128} ${Math.max(nodePositions.critic.y, nodePositions.researcher.y) + 320} ${nodePositions.researcher.x + 128} ${nodePositions.researcher.y + 220}`}
                      isActive={previousAgent === "critic_node" && activeAgent === "researcher_node"}
                      color="#ef4444"
                      flowDirection="backward"
                    />
                  </>
                )}
              </svg>

              {/* Node 1: Researcher */}
              <div
                onPointerDown={(e) => startDrag(e, "researcher")}
                className="absolute z-10 cursor-grab active:cursor-grabbing select-none"
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

              {/* Node 2: Critic */}
              <div
                onPointerDown={(e) => startDrag(e, "critic")}
                className="absolute z-10 cursor-grab active:cursor-grabbing select-none"
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

              {/* Node 3: Synthesizer */}
              <div
                onPointerDown={(e) => startDrag(e, "synthesizer")}
                className="absolute z-10 cursor-grab active:cursor-grabbing select-none"
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
              <span>DRAG BACKGROUND TO PAN | DRAG NODES</span>
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
          className={`w-full lg:w-[480px] xl:w-[560px] border-t lg:border-t-0 lg:border-l border-zinc-900 bg-zinc-950 flex flex-col overflow-hidden z-20 ${
            activeTab === "output" ? "block" : "hidden lg:block"
          }`}
        >
          
          {/* Drawer tabs for preview selection */}
          <div className="flex border-b border-zinc-900 px-4 py-2 bg-zinc-950 shrink-0 gap-1">
            <button
              onClick={() => setSelectedRole("final")}
              className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition ${
                selectedRole === "final"
                  ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Synthesis Output
            </button>
            <button
              onClick={() => setSelectedRole("researcher")}
              className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition ${
                selectedRole === "researcher"
                  ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Researcher Notes
            </button>
            <button
              onClick={() => setSelectedRole("critic")}
              className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition ${
                selectedRole === "critic"
                  ? "bg-zinc-900 text-blue-400 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Peer Critique
            </button>
          </div>

          {/* Markdown Content Block */}
          <div className="flex-1 p-4 overflow-hidden">
            <MarkdownViewer
              content={displayedMarkdown}
              isStreaming={isProcessing && selectedRole === currentNode}
              agentName={displayedTitle}
            />
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
