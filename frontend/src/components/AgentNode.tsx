import { motion } from "motion/react";
import { Search, ShieldAlert, FileText, CheckCircle2, RotateCw, AlertTriangle, Eye } from "lucide-react";
import { AgentNodeState, AgentRole } from "../types";

interface AgentNodeProps {
  node: AgentNodeState;
  isActive: boolean;
  onViewOutput: (role: AgentRole) => void;
}

const ROLE_ICONS = {
  researcher: Search,
  critic: ShieldAlert,
  synthesizer: FileText,
};

const ROLE_COLORS = {
  researcher: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    accent: "#3b82f6",
    ring: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
  },
  critic: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    accent: "#f59e0b",
    ring: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  synthesizer: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    accent: "#10b981",
    ring: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
};

export default function AgentNode({ node, isActive, onViewOutput }: AgentNodeProps) {
  const Icon = ROLE_ICONS[node.role];
  const theme = ROLE_COLORS[node.role];

  return (
    <motion.div
      id={`node-${node.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative w-64 rounded-2xl border glass-surface ${
        isActive
          ? `node-pulse ${theme.ring}`
          : "border-zinc-800/80 bg-zinc-950/50"
      } p-5 backdrop-blur-xl transition-all duration-300`}
    >
      {/* Decorative Top Accent Glow */}
      {isActive && (
        <motion.div
          layoutId="activeGlow"
          className="absolute -top-px left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-[1px]"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Connection / Pulse Ring Indicator */}
      <div className="absolute top-4 right-4 flex items-center justify-center">
        {node.status === "working" ? (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              node.role === "researcher" ? "bg-blue-400" : node.role === "critic" ? "bg-amber-400" : "bg-emerald-400"
            }`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              node.role === "researcher" ? "bg-blue-500" : node.role === "critic" ? "bg-amber-500" : "bg-emerald-500"
            }`} />
          </div>
        ) : node.status === "completed" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : node.status === "error" ? (
          <AlertTriangle className="h-5 w-5 text-rose-400" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-zinc-600" />
        )}
      </div>

      {/* Main Header */}
      <div className="flex items-start space-x-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.border} ${theme.bg}`}>
          <Icon className={`h-5.5 w-5.5 ${theme.text}`} />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="font-mono text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            {node.role} Agent
          </p>
          <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-100">
            {node.label}
          </h3>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-zinc-800/60" />

      {/* Status & Sub-title */}
      <div className="space-y-3.5">
        <div>
          <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
            <span className="truncate text-zinc-500 font-medium">Active Action:</span>
            <span className={`font-semibold shrink-0 ${
              node.status === "working" ? theme.text : "text-zinc-400"
            }`}>
              {node.status === "working" ? "Processing" : node.status === "completed" ? "Completed" : "Idle"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-300 font-medium leading-relaxed truncate">
            {node.title}
          </p>
        </div>

        {/* Progress Bar */}
        {(node.status === "working" || node.progress > 0) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Task Progress</span>
              <span className="font-semibold text-zinc-400">{Math.round(node.progress)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${node.progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${
                  node.role === "researcher" 
                    ? "from-blue-600 to-blue-400" 
                    : node.role === "critic" 
                    ? "from-amber-600 to-amber-400" 
                    : "from-emerald-600 to-emerald-400"
                }`}
              />
            </div>
          </div>
        )}

        {/* Output Preview & View Output Call-to-action */}
        {node.output ? (
          <div className="mt-2 space-y-2">
            <div className="rounded-lg bg-zinc-950/60 border border-zinc-900 p-2.5">
              <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-400 font-normal">
                {node.output.replace(/[#*`_]/g, "")}
              </p>
            </div>
            <button
              onClick={() => onViewOutput(node.role)}
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2 font-mono text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700 transition"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Inspect Workspace</span>
            </button>
          </div>
        ) : (
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-zinc-900/80 bg-zinc-950/20 py-4 text-center">
            <span className="font-mono text-[10px] text-zinc-600">Waiting for payload...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
