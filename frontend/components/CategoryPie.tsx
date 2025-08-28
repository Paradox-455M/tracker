"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export type CategoryDatum = { name: string; value: number };

export default function CategoryPie({ data }: { data: CategoryDatum[] }) {
  const colors = [
    "#82ca9d",
    "#8884d8",
    "#ffc658",
    "#ff7f50",
    "#6495ed",
    "#a78bfa",
    "#34d399",
  ];

  if (data.length === 0) {
    return <div className="text-sm text-gray-500">No data yet</div>;
  }

  return (
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
  );
}


