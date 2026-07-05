import { motion } from "motion/react";
import { Search, Globe, Radio } from "lucide-react";

interface ToolNodeProps {
  isActive: boolean;
}

export default function ToolNode({ isActive }: ToolNodeProps) {
  return (
    <motion.div
      id="node-tool-search"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative w-56 rounded-xl border backdrop-blur-xl transition-all duration-500 p-3.5 select-none ${
        isActive
          ? "border-sky-500/40 bg-zinc-950/50 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
          : "border-zinc-800/80 bg-zinc-950/50"
      }`}
    >
      {/* Cinematic Pulse / Top Accent Glow */}
      {isActive && (
        <motion.div
          className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent blur-[1px]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      )}

      {/* Header and Radar Icon */}
      <div className="flex items-center space-x-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-500 border-zinc-800 bg-zinc-900/40">
          {isActive ? (
            <>
              {/* Radar pulse rings */}
              <span className="absolute inline-flex h-full w-full rounded-lg bg-sky-500/20 animate-ping opacity-75" />
              <Search className="h-4 w-4 text-sky-400 z-10" />
            </>
          ) : (
            <Search className="h-4 w-4 text-zinc-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-semibold tracking-wider text-zinc-500 uppercase">
            External Tool
          </p>
          <h3 className="truncate text-xs font-semibold tracking-tight text-zinc-300">
            Google Search Engine
          </h3>
        </div>
      </div>

      {/* Divider */}
      <div className="my-2.5 h-px bg-zinc-900" />

      {/* Live Tool Status Indicator */}
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="text-zinc-500">Status:</span>
        <div className="flex items-center space-x-1.5">
          {isActive ? (
            <>
              <Radio className="h-3 w-3 text-sky-400 animate-pulse" />
              <span className="font-semibold text-sky-400">Querying live web...</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              <span className="font-semibold text-zinc-500">Idle</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
