const API_BASE = "http://localhost:5002";

export interface SensorReading {
  timestamp: string;
  mag_acc: number;
  mag_gyro: number;
  prediction: 0 | 1;
  confidence?: number;
  ax?: number;
  ay?: number;
  az?: number;
  gx?: number;
  gy?: number;
  gz?: number;
  diff_acc?: number;
  diff_gyro?: number;
  diff_time?: number;
}

export interface DailyStats {
  date: string;
  fall_count: number;
  normal_count: number;
  fall_percent: number;
  normal_percent: number;
}

/**
 * Fetch sensor readings within a time range.
 */
export async function fetchSensorData(
  start?: string,
  end?: string
): Promise<SensorReading[]> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  const url = `${API_BASE}/api/sensor-data?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch daily fall statistics within a date range.
 */
export async function fetchDailyStats(
  start?: string,
  end?: string
): Promise<DailyStats[]> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  const url = `${API_BASE}/api/daily-stats?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch the latest sensor reading.
 */
export async function fetchLatest(): Promise<SensorReading | null> {
  const url = `${API_BASE}/api/latest`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return Object.keys(data).length > 0 ? data : null;
}
