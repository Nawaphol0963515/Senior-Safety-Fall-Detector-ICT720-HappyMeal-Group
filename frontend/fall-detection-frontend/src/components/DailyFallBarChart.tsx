import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DailyStats } from "@/api/client";

interface DailyFallBarChartProps {
  data: DailyStats[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

export default function DailyFallBarChart({ data }: DailyFallBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = data.find((d) => d.date === label);
    return (
      <div className="bg-dark-card/95 backdrop-blur-sm border border-dark-border rounded-lg p-3 shadow-xl min-w-[160px]">
        <p className="text-dark-text-muted text-xs mb-2 font-medium">
          {new Date(label).toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent-red inline-block" />
          <span className="text-sm text-accent-red">
            Fall: {item?.fall_percent}% ({item?.fall_count})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent-green inline-block" />
          <span className="text-sm text-accent-green">
            Normal: {item?.normal_percent}% ({item?.normal_count})
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-dark-text mb-5">
        Daily Fall Rate (%)
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2b35" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#8b8fa3"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="#8b8fa3"
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

          {/* Fall % (bottom part of stacked bar) */}
          <Bar dataKey="fall_percent" stackId="daily" name="Fall %" radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`fall-${index}`}
                fill={entry.fall_percent > 10 ? "#ef4444" : "#f87171"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>

          {/* Normal % (top part of stacked bar) */}
          <Bar dataKey="normal_percent" stackId="daily" name="Normal %" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`normal-${index}`} fill="#22c55e" fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-dark-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-accent-red" />
          <span>Fall %</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-accent-green" />
          <span>Normal %</span>
        </div>
      </div>
    </div>
  );
}
