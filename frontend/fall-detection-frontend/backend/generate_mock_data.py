"""
Generate mock sensor data as JSON for development.
Run this once: python generate_mock_data.py
It creates mock_sensor_data.json in the same folder.
"""
import json
import random
import math
from datetime import datetime, timedelta

def generate():
    data = []
    now = datetime.utcnow()
    # Generate 14 days of data, one reading every 30 seconds
    start = now - timedelta(days=14)
    t = start

    while t <= now:
        is_fall = random.random() > 0.95  # ~5% fall rate

        ax = random.uniform(-1, 1)
        ay = random.uniform(-1, 1)
        az = 9.8 + random.uniform(-0.5, 0.5)
        gx = random.uniform(-0.1, 0.1)
        gy = random.uniform(-0.1, 0.1)
        gz = random.uniform(-0.1, 0.1)

        if is_fall:
            ax += random.uniform(3, 8)
            ay += random.uniform(3, 8)
            gx += random.uniform(0.3, 0.8)
            gy += random.uniform(0.3, 0.8)

        mag_acc = math.sqrt(ax**2 + ay**2 + az**2)
        mag_gyro = math.sqrt(gx**2 + gy**2 + gz**2)
        diff_acc = random.uniform(0, 5) if is_fall else random.uniform(0, 1)
        diff_gyro = random.uniform(0, 3) if is_fall else random.uniform(0, 0.5)
        diff_time = 30

        record = {
            "ax": round(ax, 4),
            "ay": round(ay, 4),
            "az": round(az, 4),
            "gx": round(gx, 4),
            "gy": round(gy, 4),
            "gz": round(gz, 4),
            "mag_acc": round(mag_acc, 4),
            "mag_gyro": round(mag_gyro, 4),
            "diff_acc": round(diff_acc, 4),
            "diff_gyro": round(diff_gyro, 4),
            "diff_time": diff_time,
            "prediction": 1 if is_fall else 0,
            "confidence": random.randint(85, 99) if is_fall else random.randint(90, 99),
            "timestamp": t.isoformat() + "Z"
        }
        data.append(record)
        t += timedelta(seconds=30)

    print(f"Generated {len(data)} records over 14 days")

    with open("mock_sensor_data.json", "w") as f:
        json.dump(data, f)

    print("Saved to mock_sensor_data.json")

if __name__ == "__main__":
    generate()
