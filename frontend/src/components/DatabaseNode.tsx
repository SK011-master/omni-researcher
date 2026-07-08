import { motion } from "motion/react";
import { Database, Server, Radio, CheckCircle2, AlertTriangle } from "lucide-react";

export type DBStatus = "idle" | "saving" | "saved" | "error";

interface DatabaseNodeProps {
  dbStatus: DBStatus;
}

export default function DatabaseNode({ dbStatus }: DatabaseNodeProps) {
  // Determine color theme based on database status
  const getThemeClasses = () => {
    switch (dbStatus) {
      case "saving":
        return {
          border: "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
          bg: "bg-emerald-950/10",
          iconContainer: "border-emerald-800 bg-emerald-950/30 text-emerald-400",
          statusText: "text-emerald-400",
          opacity: "opacity-100",
        };
      case "saved":
        return {
          border: "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          bg: "bg-zinc-950/50",
          iconContainer: "border-emerald-900 bg-emerald-950/20 text-emerald-500",
          statusText: "text-emerald-500",
          opacity: "opacity-100",
        };
      case "error":
        return {
          border: "border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
          bg: "bg-rose-950/10",
          iconContainer: "border-rose-800 bg-rose-950/30 text-rose-400",
          statusText: "text-rose-400",
          opacity: "opacity-100",
        };
      case "idle":
      default:
        return {
          border: "border-zinc-800/80",
          bg: "bg-zinc-950/50",
          iconContainer: "border-zinc-850 bg-zinc-900/40 text-zinc-500",
          statusText: "text-zinc-500",
          opacity: "opacity-60",
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <motion.div
      id="node-database"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative w-56 rounded-xl border backdrop-blur-xl transition-all duration-500 p-3.5 select-none ${theme.border} ${theme.bg} ${theme.opacity}`}
    >
      {/* Top Accent Glow line when saving/saved */}
      {(dbStatus === "saving" || dbStatus === "saved") && (
        <motion.div
          className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-[1px]"
          animate={dbStatus === "saving" ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
          transition={{ repeat: dbStatus === "saving" ? Infinity : 0, duration: 2, ease: "easeInOut" }}
        />
      )}

      {/* Header and Server/Database Icon */}
      <div className="flex items-center space-x-3">
        <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${theme.iconContainer}`}>
          {dbStatus === "saving" ? (
            <>
              {/* Pulsing emerald ring */}
              <span className="absolute inline-flex h-full w-full rounded-lg bg-emerald-500/20 animate-ping opacity-75" />
              <Database className="h-4 w-4 animate-bounce z-10" />
            </>
          ) : dbStatus === "saved" ? (
            <Database className="h-4 w-4 z-10" />
          ) : dbStatus === "error" ? (
            <AlertTriangle className="h-4 w-4 text-rose-400 z-10" />
          ) : (
            <Database className="h-4 w-4 text-zinc-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-semibold tracking-wider text-zinc-500 uppercase">
            Persistent Storage
          </p>
          <h3 className="truncate text-xs font-semibold tracking-tight text-zinc-300">
            PostgreSQL Database
          </h3>
        </div>
      </div>

      {/* Divider */}
      <div className="my-2.5 h-px bg-zinc-900" />

      {/* Live DB Status Indicator */}
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="text-zinc-500">Status:</span>
        <div className="flex items-center space-x-1.5">
          {dbStatus === "saving" ? (
            <>
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span className={`font-semibold ${theme.statusText}`}>Writing to Supabase...</span>
            </>
          ) : dbStatus === "saved" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className={`font-semibold ${theme.statusText}`}>Session Secured</span>
            </>
          ) : dbStatus === "error" ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className={`font-semibold ${theme.statusText}`}>DB Sync Error</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              <span className={`font-semibold ${theme.statusText}`}>Idle</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
