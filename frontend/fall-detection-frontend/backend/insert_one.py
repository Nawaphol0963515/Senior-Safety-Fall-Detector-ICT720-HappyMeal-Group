"""
Insert a single sensor record into MongoDB to test real-time dashboard.
Usage: python insert_one.py [fall]

  python insert_one.py          → insert a NORMAL reading
  python insert_one.py fall     → insert a FALL reading
"""
import sys
import math
import random
import certifi
from datetime import datetime
from pymongo import MongoClient

USERNAME = "happymeal_db_admin"
PASSWORD = "Happymeal1234"
MONGO_URL = f"mongodb+srv://{USERNAME}:{PASSWORD}@happymeal.oen73dn.mongodb.net/"
DB_NAME = "happymeal_db"
COLLECTION_NAME = "sensor_data"

def main():
    is_fall = "fall" in [a.lower() for a in sys.argv[1:]]

    # Generate sensor values
    if is_fall:
        ax = 5 + random.uniform(0, 5)
        ay = 4 + random.uniform(0, 5)
        az = 9.8 + random.uniform(-1, 3)
        gx = 0.4 + random.uniform(0, 0.5)
        gy = 0.3 + random.uniform(0, 0.5)
        gz = random.uniform(-0.1, 0.1)
    else:
        ax = random.uniform(-1, 1)
        ay = random.uniform(-1, 1)
        az = 9.8 + random.uniform(-0.3, 0.3)
        gx = random.uniform(-0.05, 0.05)
        gy = random.uniform(-0.05, 0.05)
        gz = random.uniform(-0.05, 0.05)

    mag_acc = math.sqrt(ax**2 + ay**2 + az**2)
    mag_gyro = math.sqrt(gx**2 + gy**2 + gz**2)

    record = {
        "ax": round(ax, 4),
        "ay": round(ay, 4),
        "az": round(az, 4),
        "gx": round(gx, 4),
        "gy": round(gy, 4),
        "gz": round(gz, 4),
        "mag_acc": round(mag_acc, 4),
        "mag_gyro": round(mag_gyro, 4),
        "diff_acc": round(random.uniform(0, 3), 4),
        "diff_gyro": round(random.uniform(0, 1), 4),
        "diff_time": 30,
        "prediction": 0,
        # "prediction": 1 if is_fall else 0,
        "confidence": random.randint(85, 99),
        "timestamp": datetime.utcnow()
    }

    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGO_URL, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
    collection = client[DB_NAME][COLLECTION_NAME]

    result = collection.insert_one(record)

    status = "🔴 FALL" if is_fall else "🟢 NORMAL"
    print(f"\n✅ Inserted 1 record: {status}")
    print(f"   mag_acc:    {record['mag_acc']}")
    print(f"   mag_gyro:   {record['mag_gyro']}")
    print(f"   prediction: {record['prediction']}")
    print(f"   timestamp:  {record['timestamp']}")
    print(f"   _id:        {result.inserted_id}")
    print(f"\n💡 Dashboard will refresh in ~30 seconds (auto-refresh interval)")

    client.close()

if __name__ == "__main__":
    main()
