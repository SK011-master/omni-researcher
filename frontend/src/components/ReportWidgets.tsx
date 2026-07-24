import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";

// --- KPI Widget ---
export interface KPIItem {
  label: string;
  value: string | number;
  subtext?: string;
}

interface KPIWidgetProps {
  data: KPIItem[];
}

export function KPIWidget({ data }: KPIWidgetProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-500 font-mono text-xs text-center">
        Empty or invalid KPI data array
      </div>
    );
  }

  return (
    // Changed to a 2-column grid to give the text more room to breathe
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col space-y-1">
            <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
              {item.label}
            </span>
            {/* Reduced text size and added break-words to handle long strings */}
            <span className="text-lg font-bold tracking-tight text-white font-sans leading-tight break-words">
              {item.value}
            </span>
            {item.subtext && (
              <span className="text-[11px] text-zinc-400 font-medium leading-snug">
                {item.subtext}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// --- Chart Widget ---
export interface ChartDataItem {
  [key: string]: any;
}

export interface ChartData {
  xAxis: string;
  yAxis: string;
  data: ChartDataItem[];
}

interface ChartWidgetProps {
  data: ChartData;
}

export function ChartWidget({ data }: ChartWidgetProps) {
  if (!data || !Array.isArray(data.data) || data.data.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-500 font-mono text-xs text-center">
        Empty or invalid chart data structure
      </div>
    );
  }

  const { xAxis, yAxis, data: chartData } = data;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="my-6 rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 hover:border-blue-500/10 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col space-y-1">
          <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            Data Visualization
          </span>
          <h4 className="text-xs font-semibold text-zinc-200 tracking-tight font-sans capitalize">
            {yAxis} over {xAxis}
          </h4>
        </div>
      </div>

      {/* Reduced height to fit nicely within the markdown flow */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* Swapped to AreaChart and fixed left margin to stop Y-Axis clipping */}
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name" 
              stroke="#52525b"
              tickLine={false}
              axisLine={false}
              className="font-mono text-[9px] font-bold uppercase tracking-wider"
              dy={10}
            />
            <YAxis
              stroke="#52525b"
              tickLine={false}
              axisLine={false}
              className="font-mono text-[9px] font-bold"
              width={40} // Forced width prevents number clipping
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderRadius: "12px",
                padding: "10px 14px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: "11px",
                color: "#f4f4f5"
              }}
              itemStyle={{ color: "#60a5fa", fontWeight: "bold" }}
              labelStyle={{ color: "#a1a1aa", marginBottom: "4px", fontSize: "10px", fontFamily: "var(--font-mono, monospace)" }}
              cursor={{ stroke: "#27272a", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              activeDot={{ r: 6, fill: "#60a5fa", stroke: "#1d4ed8", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}