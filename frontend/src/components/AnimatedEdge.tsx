import { motion } from "motion/react";

interface AnimatedEdgeProps {
  id: string;
  pathD: string;
  isActive: boolean;
  color: string;
  flowDirection?: "forward" | "backward";
}

export default function AnimatedEdge({
  id,
  pathD,
  isActive,
  color,
  flowDirection = "forward",
}: AnimatedEdgeProps) {
  return (
    <g>
      {/* Glow shadow line */}
      {isActive && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          className="opacity-20 blur-md pointer-events-none"
        />
      )}

      {/* Base Connector Line */}
      <path
        d={pathD}
        fill="none"
        stroke={isActive ? `${color}40` : "rgba(113, 113, 122, 0.3)"}
        strokeWidth="4"
        strokeLinecap="round"
        className="pointer-events-none transition-colors duration-500"
      />

      {/* Pulsing Dash Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={isActive ? color : "rgba(161, 161, 170, 0.45)"}
        strokeWidth={isActive ? "3" : "2.5"}
        strokeDasharray="8 8"
        strokeLinecap="round"
        className="pointer-events-none"
        style={{
          filter: isActive ? `drop-shadow(0 0 6px ${color})` : "none",
        }}
        animate={
          isActive
            ? {
                strokeDashoffset: flowDirection === "forward" ? [-120, 0] : [0, -120],
              }
            : {}
        }
        transition={
          isActive
            ? {
                strokeDashoffset: {
                  repeat: Infinity,
                  ease: "linear",
                  duration: 2.0,
                },
              }
            : {}
        }
      />

      {/* Glowing Moving Packet Dot */}
      {isActive && (
        <motion.circle
          r="5"
          fill={color}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
          className="pointer-events-none"
        >
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path={pathD}
            keyPoints={flowDirection === "forward" ? "0;1" : "1;0"}
            keyTimes="0;1"
            calcMode="linear"
          />
        </motion.circle>
      )}
    </g>
  );
}
