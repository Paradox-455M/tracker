"use client";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { useReducedMotion } from "framer-motion";

export default function Sparkline({ data, color = "#9EFF00" }: { data: number[]; color?: string }) {
  const prefersReduced = useReducedMotion();
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-full h-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={color}
            fillOpacity={0.12}
            strokeWidth={2}
            isAnimationActive={!prefersReduced}
            animationDuration={prefersReduced ? 0 : 400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


