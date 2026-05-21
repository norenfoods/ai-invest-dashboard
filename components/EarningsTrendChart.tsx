"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EarningsTrendChartProps<T extends Record<string, string | number | null>> = {
  data: T[];
  dataKey: keyof T;
  label: string;
  color: string;
  unit?: "currency" | "percent";
  height?: number;
};

const formatCurrency = (value: number): string => {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  }

  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(0)}B`;
  }

  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)}M`;
  }

  return value.toLocaleString("en-US");
};

export default function EarningsTrendChart<T extends Record<string, string | number | null>>({
  data,
  dataKey,
  label,
  color,
  unit = "currency",
  height = 240,
}: EarningsTrendChartProps<T>) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#213047" strokeDasharray="3 3" opacity={0.45} />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8EA0B8", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8EA0B8", fontSize: 12 }}
            tickFormatter={(value) =>
              unit === "percent" ? `${value}%` : formatCurrency(Number(value))
            }
            width={58}
          />
          <Tooltip
            contentStyle={{
              background: "#0D1420",
              border: "1px solid #213047",
              borderRadius: 8,
              color: "#E6EEF8",
            }}
            labelStyle={{ color: "#8EA0B8" }}
            formatter={(value) => {
              const numberValue = Number(value);
              return [
                unit === "percent"
                  ? `${numberValue.toFixed(1)}%`
                  : `$${formatCurrency(numberValue)}`,
                label,
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey as string}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
