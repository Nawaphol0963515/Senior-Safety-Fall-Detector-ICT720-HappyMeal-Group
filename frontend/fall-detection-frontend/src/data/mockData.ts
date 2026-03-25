export interface SensorReading {
  timestamp: string;
  mag_acc: number;
  mag_gyro: number;
  value: number; // combined magnitude = sqrt(mag_acc² + mag_gyro²)
  prediction: 0 | 1; // 0 = normal, 1 = fall
}

export interface DailyStats {
  date: string;
  fall_count: number;
  normal_count: number;
  fall_percent: number;
  normal_percent: number;
}

// Generate mock sensor data for "today" (last 2 hours, every 10 seconds)
function generateTodayData(): SensorReading[] {
  const data: SensorReading[] = [];
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  for (let t = twoHoursAgo.getTime(); t <= now.getTime(); t += 10_000) {
    const isFall = Math.random() > 0.92;
    const mag_acc = isFall ? 5 + Math.random() * 8 : 0.5 + Math.random() * 2;
    const mag_gyro = isFall ? 0.3 + Math.random() * 0.5 : 0.01 + Math.random() * 0.08;
    data.push({
      timestamp: new Date(t).toISOString(),
      mag_acc,
      mag_gyro,
      value: Math.sqrt(mag_acc * mag_acc + mag_gyro * mag_gyro),
      prediction: isFall ? 1 : 0,
    });
  }
  return data;
}

// Generate mock daily stats for the past 14 days
function generateDailyStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const total = 200 + Math.floor(Math.random() * 300);
    const falls = Math.floor(Math.random() * 30);
    const normals = total - falls;
    const fallPct = Math.round((falls / total) * 100);
    stats.push({
      date: d.toISOString().slice(0, 10),
      fall_count: falls,
      normal_count: normals,
      fall_percent: fallPct,
      normal_percent: 100 - fallPct,
    });
  }
  return stats;
}

export const todaySensorData = generateTodayData();
export const dailyStats = generateDailyStats();
