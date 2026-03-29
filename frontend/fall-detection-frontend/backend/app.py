"""
Fall Detection Backend API
- Serves sensor data from JSON file (dev mode) or MongoDB (production)
- Endpoints:
  GET /api/sensor-data?start=ISO&end=ISO  → sensor readings
  GET /api/daily-stats?start=YYYY-MM-DD&end=YYYY-MM-DD → daily fall stats
  GET /api/latest → latest reading
"""
import json
import os
import requests as http_requests
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend (localhost:5173) to call this API

# ⚠️ Change this to your ESP32-CAM's IP address
ESP32_CAM_IP = os.environ.get("ESP32_CAM_IP", "172.20.10.2")
ESP32_CAM_BASE = f"http://{ESP32_CAM_IP}"

# ---------------------------------------------------------------------------
# Data source: JSON file (switch to MongoDB when ready)
# ---------------------------------------------------------------------------
USE_MONGODB = True  # Reading from MongoDB Atlas

MOCK_DATA_PATH = os.path.join(os.path.dirname(__file__), "mock_sensor_data.json")

# Cache loaded data in memory
_sensor_cache: list[dict] | None = None


def _load_json_data() -> list[dict]:
    """Load mock data from JSON file (cached)."""
    global _sensor_cache
    if _sensor_cache is None:
        with open(MOCK_DATA_PATH, "r") as f:
            _sensor_cache = json.load(f)
        print(f"Loaded {len(_sensor_cache)} records from JSON")
    return _sensor_cache


def _get_mongo_collection():
    """Return MongoDB collection (lazy init)."""
    import certifi
    from pymongo import MongoClient

    username = os.environ.get("MONGO_USERNAME", "happymeal_db_admin")
    password = os.environ.get("MONGO_PASSWORD", "Happymeal1234")
    url = f"mongodb+srv://{username}:{password}@happymeal.oen73dn.mongodb.net/"
    client = MongoClient(url, tlsCAFile=certifi.where())
    return client["happymeal_db"]["sensor_data"]


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.route("/api/sensor-data", methods=["GET"])
def get_sensor_data():
    """
    Return sensor readings filtered by time range.
    Query params:
      - start (ISO string): start time (inclusive)
      - end   (ISO string): end time (inclusive)
    """
    start = request.args.get("start")
    end = request.args.get("end")

    if USE_MONGODB:
        collection = _get_mongo_collection()
        query = {}
        if start or end:
            query["timestamp"] = {}
            if start:
                query["timestamp"]["$gte"] = datetime.fromisoformat(start.replace("Z", "+00:00"))
            if end:
                query["timestamp"]["$lte"] = datetime.fromisoformat(end.replace("Z", "+00:00"))

        cursor = collection.find(query, {"_id": 0}).sort("timestamp", 1).limit(5000)
        results = []
        for doc in cursor:
            if isinstance(doc.get("timestamp"), datetime):
                ts = doc["timestamp"]
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                doc["timestamp"] = ts.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
            results.append(doc)
        return jsonify(results)

    # JSON file mode
    data = _load_json_data()

    if start or end:
        filtered = []
        for d in data:
            ts = d["timestamp"]
            if start and ts < start:
                continue
            if end and ts > end:
                continue
            filtered.append(d)
        data = filtered

    # Limit to 5000 records to avoid overloading the frontend
    if len(data) > 5000:
        step = len(data) // 5000
        data = data[::step]

    return jsonify(data)


@app.route("/api/daily-stats", methods=["GET"])
def get_daily_stats():
    """
    Return daily fall statistics.
    Query params:
      - start (YYYY-MM-DD): start date
      - end   (YYYY-MM-DD): end date
    """
    start = request.args.get("start")
    end = request.args.get("end")

    if USE_MONGODB:
        collection = _get_mongo_collection()
        pipeline = [
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "fall_count": {"$sum": {"$cond": [{"$eq": ["$prediction", 1]}, 1, 0]}},
                "normal_count": {"$sum": {"$cond": [{"$eq": ["$prediction", 0]}, 1, 0]}},
                "total": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        if start or end:
            match = {}
            if start:
                match["$gte"] = datetime.fromisoformat(start + "T00:00:00+00:00")
            if end:
                match["$lte"] = datetime.fromisoformat(end + "T23:59:59+00:00")
            pipeline.insert(0, {"$match": {"timestamp": match}})

        results = []
        for doc in collection.aggregate(pipeline):
            total = doc["total"]
            fall_pct = round((doc["fall_count"] / total) * 100) if total else 0
            results.append({
                "date": doc["_id"],
                "fall_count": doc["fall_count"],
                "normal_count": doc["normal_count"],
                "fall_percent": fall_pct,
                "normal_percent": 100 - fall_pct,
            })
        return jsonify(results)

    # JSON file mode
    data = _load_json_data()
    daily: dict[str, dict] = defaultdict(lambda: {"fall": 0, "normal": 0})

    for d in data:
        date_str = d["timestamp"][:10]
        if start and date_str < start:
            continue
        if end and date_str > end:
            continue
        if d["prediction"] == 1:
            daily[date_str]["fall"] += 1
        else:
            daily[date_str]["normal"] += 1

    results = []
    for date_str in sorted(daily.keys()):
        counts = daily[date_str]
        total = counts["fall"] + counts["normal"]
        fall_pct = round((counts["fall"] / total) * 100) if total else 0
        results.append({
            "date": date_str,
            "fall_count": counts["fall"],
            "normal_count": counts["normal"],
            "fall_percent": fall_pct,
            "normal_percent": 100 - fall_pct,
        })

    return jsonify(results)


@app.route("/api/latest", methods=["GET"])
def get_latest():
    """Return the latest sensor reading."""
    if USE_MONGODB:
        collection = _get_mongo_collection()
        doc = collection.find_one({}, {"_id": 0}, sort=[("timestamp", -1)])
        if doc and isinstance(doc.get("timestamp"), datetime):
            ts = doc["timestamp"]
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            doc["timestamp"] = ts.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        return jsonify(doc or {})

    data = _load_json_data()
    return jsonify(data[-1] if data else {})


# ---------------------------------------------------------------------------
# Camera Control API (proxy to ESP32-CAM)
# ---------------------------------------------------------------------------

@app.route("/api/camera/status", methods=["GET"])
def camera_status():
    """Get camera status from ESP32-CAM."""
    try:
        resp = http_requests.get(f"{ESP32_CAM_BASE}/status", timeout=5)
        return jsonify(resp.json()), resp.status_code
    except http_requests.exceptions.RequestException as e:
        return jsonify({
            "stream_active": False,
            "error": f"Cannot reach ESP32-CAM at {ESP32_CAM_BASE}: {str(e)}"
        }), 503


@app.route("/api/camera/start", methods=["POST"])
def camera_start():
    """Start camera stream on ESP32-CAM."""
    try:
        resp = http_requests.get(f"{ESP32_CAM_BASE}/start-stream", timeout=15)
        return jsonify(resp.json()), resp.status_code
    except http_requests.exceptions.RequestException as e:
        return jsonify({
            "status": "error",
            "message": f"Cannot reach ESP32-CAM at {ESP32_CAM_BASE}: {str(e)}"
        }), 503


@app.route("/api/camera/stop", methods=["POST"])
def camera_stop():
    """Stop camera stream on ESP32-CAM."""
    try:
        resp = http_requests.get(f"{ESP32_CAM_BASE}/stop-stream", timeout=15)
        return jsonify(resp.json()), resp.status_code
    except http_requests.exceptions.RequestException as e:
        return jsonify({
            "status": "error",
            "message": f"Cannot reach ESP32-CAM at {ESP32_CAM_BASE}: {str(e)}"
        }), 503


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("🚀 Starting Fall Detection API on http://localhost:5002")
    print(f"   Data source: {'MongoDB' if USE_MONGODB else 'JSON file'}")
    print(f"   ESP32-CAM:   {ESP32_CAM_BASE}")
    app.run(host="0.0.0.0", port=5002, debug=True)
