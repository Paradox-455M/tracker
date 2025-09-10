"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";

export type CategoryDatum = { name: string; value: number };

export default function CategoryPie({ data }: { data: CategoryDatum[] }) {
  const colors = [
    "#9EFF00",
    "#00FFC6",
    "#FFB347",
    "#FF5F7E",
    "#4BA3FF",
  ];

  if (data.length === 0) {
    return <div className="text-sm text-gray-500">No data yet</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}


