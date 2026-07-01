import React, { useState, KeyboardEvent } from "react";
import { Terminal, Send, XCircle, Trash2, Wifi, WifiOff } from "lucide-react";
import { ConnectionStatus } from "../types";

interface CommandTerminalProps {
  connectionStatus: ConnectionStatus;
  onSubmit: (query: string) => void;
  onCancel: () => void;
  onReset: () => void;
  isProcessing: boolean;
  activeQuery: string;
}

const SAMPLE_PRESETS = [
  "Analyze the commercial viability of nuclear fusion energy.",
  "Compare solid-state batteries vs. lithium-ion for EVs.",
  "Evaluate the impact of transformer architecture on LLM latency.",
];

export default function CommandTerminal({
  connectionStatus,
  onSubmit,
  onCancel,
  onReset,
  isProcessing,
  activeQuery,
}: CommandTerminalProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim() || isProcessing) return;
    onSubmit(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handlePresetClick = (preset: string) => {
    if (isProcessing) return;
    onSubmit(preset);
  };

  const isConnected = connectionStatus === "connected";

  return (
    <div className="w-full space-y-2.5 sm:space-y-4">
      {/* Preset Queries Grid */}
      {!isProcessing && !activeQuery && (
        <div className="space-y-1.5 px-1 shrink-0">
          <p className="font-mono text-[9px] sm:text-[10px] tracking-wider text-zinc-500 uppercase font-semibold">
            Suggested Intelligence Directives
          </p>
          
          {/* Desktop/Tablet Grid */}
          <div className="hidden md:grid grid-cols-3 gap-3">
            {SAMPLE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className="text-left rounded-xl border border-zinc-900/80 bg-zinc-950/40 p-3 text-xs text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-200 transition text-ellipsis overflow-hidden font-normal"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Mobile Horizontal Swipeable Row */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory -mx-4 px-4">
            {SAMPLE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className="text-left rounded-xl border border-zinc-900/80 bg-zinc-950/40 py-2 px-3 text-xs text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-200 transition font-normal whitespace-nowrap snap-start shrink-0 max-w-[260px] truncate"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="relative space-y-2.5">
        <div className={`shimmer-border rounded-2xl p-[1px] transition-all duration-700 ${
          isConnected ? "opacity-100" : "opacity-80 border border-zinc-800"
        }`}>
          {/* Inner Terminal Card */}
          <div className="relative flex flex-col gap-3.5 rounded-[15px] bg-zinc-950 p-3.5 sm:p-4">
            
            {/* Top Block: Connection indicator */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${
                  isConnected ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400" : "border-zinc-800 bg-zinc-900/10 text-zinc-500"
                }`}>
                  <Terminal className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-zinc-500 uppercase font-bold">
                      System Status
                    </span>
                    {isConnected ? (
                      <span className="flex items-center font-mono text-[8px] sm:text-[10px] text-emerald-400 font-semibold uppercase bg-emerald-400/5 border border-emerald-400/20 px-1.5 py-0.5 rounded-md">
                        <Wifi className="mr-1 h-2.5 w-2.5" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center font-mono text-[8px] sm:text-[10px] text-zinc-500 font-semibold uppercase bg-zinc-800/30 border border-zinc-800/60 px-1.5 py-0.5 rounded-md animate-pulse">
                        <WifiOff className="mr-1 h-2.5 w-2.5" /> Offline
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] sm:text-xs font-medium text-zinc-400 mt-0.5 font-mono">
                    {isProcessing
                      ? `RUNNING: "${activeQuery}"`
                      : isConnected
                      ? "Awaiting command center execution request..."
                      : "Connecting to agent core..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Input & Execution Bar Row (Side-by-side on all screens) */}
            <div className="flex items-center space-x-2 w-full">
              {/* Input Field */}
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  disabled={isProcessing}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isProcessing
                      ? "Compiling intelligence..."
                      : "Enter research directive..."
                  }
                  className="w-full rounded-xl border border-zinc-900 bg-zinc-950/80 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/60 transition disabled:opacity-40"
                />
              </div>

              {/* Actions Block */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {isProcessing ? (
                  <button
                    onClick={onCancel}
                    className="flex items-center justify-center space-x-1 sm:space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-rose-400 hover:border-rose-500/30 transition shadow-sm"
                  >
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <span>Abort</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    {activeQuery && (
                      <button
                        onClick={onReset}
                        className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/10 p-2 sm:p-2.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 transition"
                        title="Clear Workspace"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isProcessing}
                      className="flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-3.5 sm:px-5 py-2 sm:py-2.5 font-mono text-xs font-bold text-white hover:bg-blue-500 transition shadow-[0_4px_12px_rgba(59,130,246,0.25)] disabled:opacity-40 disabled:hover:bg-blue-600 select-none cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Execute</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Latency / System info footer under the terminal */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[9px] text-zinc-500 uppercase tracking-widest font-semibold text-center px-4">
          <span>Latency: 42ms</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Web-Agent: On</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Auto-Synth: Active</span>
        </div>
      </div>
    </div>
  );
}
