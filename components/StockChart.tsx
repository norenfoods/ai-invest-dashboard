"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/mockData";

type StockChartProps = {
  data: TrendPoint[];
  height?: number;
  color?: string;
};

export default function StockChart({
  data,
  height = 260,
  color = "#45C7E8",
}: StockChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8EA0B8", fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8EA0B8", fontSize: 12 }}
            width={52}
            domain={["dataMin - 2", "dataMax + 2"]}
          />
          <Tooltip
            contentStyle={{
              background: "#0D1420",
              border: "1px solid #213047",
              borderRadius: 8,
              color: "#E6EEF8",
            }}
            labelStyle={{ color: "#8EA0B8" }}
            formatter={(value) => [`$${value}`, "价格"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
