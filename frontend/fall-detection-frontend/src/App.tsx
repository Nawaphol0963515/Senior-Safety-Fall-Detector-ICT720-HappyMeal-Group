import { useState, useEffect, useCallback } from "react";
import StatusBadge from "@/components/StatusBadge";
import FallCounter from "@/components/FallCounter";
import SensorChart from "@/components/SensorChart";
import DailyFallBarChart from "@/components/DailyFallBarChart";
import CameraModal from "@/components/CameraModal";

// ⚠️ Change this to your ESP32-CAM's IP address
const ESP32_STREAM_URL = "http://192.168.1.100:81/stream";
import {
  fetchSensorData,
  fetchDailyStats,
  fetchLatest,
} from "@/api/client";
import type { SensorReading, DailyStats } from "@/api/client";

export default function App() {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's sensor data (last 2 hours)
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const [sensor, stats, latestReading] = await Promise.all([
        fetchSensorData(twoHoursAgo.toISOString(), now.toISOString()),
        fetchDailyStats(),
        fetchLatest(),
      ]);

      setSensorData(sensor);
      setDailyStats(stats);
      setLatest(latestReading);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(loadData, 5_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const isFall = latest?.prediction === 1;
  const fallCount = sensorData.filter((d) => d.prediction === 1).length;

  const handleVideoClick = () => {
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-white text-lg font-bold">🛡</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark-text tracking-tight">
                Senior Safety
              </h1>
              <p className="text-xs text-dark-text-muted">
                Fall Detection Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className={`flex items-center gap-1.5 text-xs ${error ? "text-accent-red" : "text-accent-green"}`}>
              <span className={`w-2 h-2 rounded-full ${error ? "bg-accent-red" : "bg-accent-green"}`} />
              {error ? "Disconnected" : "Live"}
            </div>
            <div className="text-sm text-dark-text-muted">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-accent-red text-lg">⚠</span>
              <div>
                <p className="text-accent-red font-medium text-sm">Cannot connect to backend</p>
                <p className="text-dark-text-muted text-xs mt-0.5">
                  Make sure the Flask server is running: <code className="bg-dark-bg px-1.5 py-0.5 rounded text-xs">python app.py</code> in the backend folder
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-red/15 text-accent-red border border-accent-red/30 hover:bg-accent-red/25 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !sensorData.length && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-dark-text-muted">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading data...
            </div>
          </div>
        )}

        {/* Dashboard content */}
        {!loading || sensorData.length > 0 ? (
          <>
            {/* Top Row: Status + Fall Count */}
            <div className="flex flex-wrap items-start gap-6">
              <StatusBadge isFall={isFall} onVideoClick={handleVideoClick} />
              <FallCounter count={fallCount} />
            </div>

            {/* Sensor Chart */}
            <SensorChart data={sensorData} />

            {/* Daily Bar Chart */}
            <DailyFallBarChart data={dailyStats} />
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-4 mt-auto">
        <p className="text-center text-xs text-dark-text-muted">
          ICT720 — HappyMeal Group • Senior Safety Fall Detector
        </p>
      </footer>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        streamUrl={ESP32_STREAM_URL}
      />
    </div>
  );
}