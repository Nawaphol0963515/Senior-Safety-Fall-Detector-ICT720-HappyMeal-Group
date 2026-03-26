import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { SensorReading } from "@/api/client";

type TabMode = "today" | "all";

interface SensorChartProps {
  data: SensorReading[];
}

// Format time for x-axis
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatTooltipTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function SensorChart({ data }: SensorChartProps) {
  const [tab, setTab] = useState<TabMode>("today");

  // Date range for "all" tab
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  // Time range for "today" tab (default 1 hr)
  const [startHour, setStartHour] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() - 1);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [endHour, setEndHour] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  // Auto-slide time window: update start/end to follow current time
  useEffect(() => {
    if (tab === "today") {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      setStartHour(`${String(oneHourAgo.getHours()).padStart(2, "0")}:${String(oneHourAgo.getMinutes()).padStart(2, "0")}`);
      setEndHour(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }
  }, [data, tab]);

  // Zoom state for ReferenceArea
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomLeft, setZoomLeft] = useState<string | null>(null);
  const [zoomRight, setZoomRight] = useState<string | null>(null);
  const isDragging = useRef(false);

  // Filter data based on tab and range
  const filteredData = useMemo(() => {
    let filtered = data;

    if (tab === "today") {
      const today = new Date().toISOString().slice(0, 10);
      const [sh, sm] = startHour.split(":").map(Number);
      const [eh, em] = endHour.split(":").map(Number);

      filtered = data.filter((d) => {
        const dt = new Date(d.timestamp);
        if (dt.toISOString().slice(0, 10) !== today) return false;
        const mins = dt.getHours() * 60 + dt.getMinutes();
        return mins >= sh * 60 + sm && mins <= eh * 60 + em;
      });
    } else {
      filtered = data.filter((d) => {
        const dateStr = d.timestamp.slice(0, 10);
        return dateStr >= startDate && dateStr <= endDate;
      });
    }

    // Apply zoom
    if (zoomLeft && zoomRight) {
      const leftIdx = filtered.findIndex((d) => d.timestamp >= zoomLeft);
      const rightIdx = filtered.findIndex((d) => d.timestamp > zoomRight);
      filtered = filtered.slice(
        Math.max(0, leftIdx),
        rightIdx === -1 ? filtered.length : rightIdx
      );
    }

    return filtered;
  }, [data, tab, startHour, endHour, startDate, endDate, zoomLeft, zoomRight]);

  const handleMouseDown = useCallback((e: { activeLabel?: string }) => {
    if (e?.activeLabel) {
      isDragging.current = true;
      setRefAreaLeft(e.activeLabel);
      setRefAreaRight(null);
    }
  }, []);

  const handleMouseMove = useCallback((e: { activeLabel?: string }) => {
    if (isDragging.current && e?.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (refAreaLeft && refAreaRight) {
      const [left, right] =
        refAreaLeft < refAreaRight
          ? [refAreaLeft, refAreaRight]
          : [refAreaRight, refAreaLeft];
      setZoomLeft(left);
      setZoomRight(right);
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
    isDragging.current = false;
  }, [refAreaLeft, refAreaRight]);

  const resetZoom = useCallback(() => {
    setZoomLeft(null);
    setZoomRight(null);
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-card/95 backdrop-blur-sm border border-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-dark-text-muted text-xs mb-2">
          {formatTooltipTime(label)}
        </p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{" "}
            {entry.name === "prediction"
              ? entry.value === 1 ? "FALL" : "NORMAL"
              : entry.value?.toFixed(3)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-dark-text">
          Sensor Readings
        </h2>

        <div className="flex items-center gap-2">
          {/* Tab Buttons */}
          <div className="flex bg-dark-bg rounded-lg p-1 border border-dark-border">
            <button
              onClick={() => { setTab("today"); resetZoom(); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === "today"
                  ? "bg-accent-blue text-white shadow-md"
                  : "text-dark-text-muted hover:text-dark-text"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setTab("all"); resetZoom(); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === "all"
                  ? "bg-accent-blue text-white shadow-md"
                  : "text-dark-text-muted hover:text-dark-text"
              }`}
            >
              All
            </button>
          </div>

          {/* Zoom reset */}
          {(zoomLeft || zoomRight) && (
            <button
              onClick={resetZoom}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-purple/15 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/25 transition-all"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {tab === "today" ? (
          <>
            <label className="text-dark-text-muted text-sm">From</label>
            <input
              type="time"
              value={startHour}
              onChange={(e) => { setStartHour(e.target.value); resetZoom(); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue transition-colors"
            />
            <label className="text-dark-text-muted text-sm">To</label>
            <input
              type="time"
              value={endHour}
              onChange={(e) => { setEndHour(e.target.value); resetZoom(); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue transition-colors"
            />
          </>
        ) : (
          <>
            <label className="text-dark-text-muted text-sm">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); resetZoom(); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue transition-colors"
            />
            <label className="text-dark-text-muted text-sm">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); resetZoom(); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text focus:outline-none focus:border-accent-blue transition-colors"
            />
          </>
        )}
        <span className="text-dark-text-muted text-xs ml-auto">
          {filteredData.length} readings — Drag on chart to zoom
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={filteredData}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2b35" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#8b8fa3"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />

          {/* Single Y-axis */}
          <YAxis
            domain={[0, 'auto']}
            stroke="#8b8fa3"
            tick={{ fontSize: 11 }}
            label={{
              value: "Value",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#8b8fa3", fontSize: 12 },
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* mag_acc line */}
          <Line
            type="monotone"
            dataKey="mag_acc"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            name="mag_acc"
          />

          {/* mag_gyro line */}
          <Line
            type="monotone"
            dataKey="mag_gyro"
            stroke="#a855f7"
            strokeWidth={1.5}
            dot={false}
            name="mag_gyro"
          />

          {/* Prediction step line */}
          <Line
            type="stepAfter"
            dataKey="prediction"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={false}
            name="prediction"
          />

          {/* Zoom selection area */}
          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill="#3b82f6"
              fillOpacity={0.1}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-dark-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-accent-blue rounded" />
          <span>mag_acc</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-accent-purple rounded" />
          <span>mag_gyro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-accent-red rounded border-dashed" />
          <span>Prediction (0 = Normal, 1 = Fall)</span>
        </div>
      </div>
    </div>
  );
}
