"""
Upload mock sensor data from JSON file to MongoDB Atlas.
Usage: python upload_to_db.py

This will:
1. Read mock_sensor_data.json
2. Convert timestamps to datetime objects
3. Insert all records into MongoDB collection 'sensor_data'
"""
import json
import certifi
from datetime import datetime
from pymongo import MongoClient

# MongoDB connection
USERNAME = "happymeal_db_admin"
PASSWORD = "Happymeal1234"
MONGO_URL = f"mongodb+srv://{USERNAME}:{PASSWORD}@happymeal.oen73dn.mongodb.net/"

JSON_FILE = "mock_sensor_data.json"
DB_NAME = "happymeal_db"
COLLECTION_NAME = "sensor_data"
BATCH_SIZE = 1000  # Insert in batches for better performance


def main():
    # 1. Connect to MongoDB
    print(f"Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URL, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)

    # Test connection
    try:
        client.admin.command("ping")
        print("✅ Connected to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ Cannot connect to MongoDB: {e}")
        print("\n⚠️  Make sure you have whitelisted your IP in MongoDB Atlas:")
        print("   1. Go to https://cloud.mongodb.com/")
        print("   2. Security → Network Access")
        print("   3. Add IP Address → Allow Access from Anywhere (0.0.0.0/0)")
        return

    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # 2. Load JSON data
    print(f"Loading data from {JSON_FILE}...")
    with open(JSON_FILE, "r") as f:
        data = json.load(f)
    print(f"   Loaded {len(data)} records")

    # 3. Convert timestamps to datetime objects
    print("Converting timestamps...")
    for record in data:
        ts = record["timestamp"]
        # Parse ISO format: "2026-03-12T04:02:14.147864Z"
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        record["timestamp"] = datetime.fromisoformat(ts)

    # 4. Optional: Clear existing data first
    existing_count = collection.count_documents({})
    if existing_count > 0:
        print(f"   Found {existing_count} existing records in collection")
        response = input("   Do you want to DELETE existing data before inserting? (y/N): ").strip().lower()
        if response == "y":
            collection.delete_many({})
            print("   ✅ Cleared existing data")
        else:
            print("   Keeping existing data, appending new records")

    # 5. Insert in batches
    print(f"Inserting {len(data)} records in batches of {BATCH_SIZE}...")
    total_inserted = 0
    for i in range(0, len(data), BATCH_SIZE):
        batch = data[i : i + BATCH_SIZE]
        result = collection.insert_many(batch)
        total_inserted += len(result.inserted_ids)
        progress = min(100, round((total_inserted / len(data)) * 100))
        print(f"   [{progress:3d}%] Inserted {total_inserted}/{len(data)} records")

    print(f"\n✅ Done! Inserted {total_inserted} records into {DB_NAME}.{COLLECTION_NAME}")

    # 6. Verify
    count = collection.count_documents({})
    print(f"   Total documents in collection: {count}")

    # Show a sample record
    sample = collection.find_one({}, {"_id": 0})
    if sample:
        print(f"\n📋 Sample record:")
        for key, value in sample.items():
            print(f"   {key}: {value}")

    client.close()


if __name__ == "__main__":
    main()
