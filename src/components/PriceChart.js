import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const toCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const PriceChart = ({ chartData }) => (
  <div className="chart-anim">
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="closeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1565d8" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#1565d8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 33, 59, 0.12)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
        />
        <YAxis
          tickFormatter={(v) => `$${v.toFixed(0)}`}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          width={64}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <Tooltip
          contentStyle={{
            border: "1px solid var(--line)",
            borderRadius: "10px",
            backgroundColor: "var(--panel-strong)",
          }}
          formatter={(value) => [toCurrency(value), "Close"]}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#1565d8"
          strokeWidth={2}
          fill="url(#closeArea)"
          isAnimationActive
          animationDuration={420}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default React.memo(PriceChart);
