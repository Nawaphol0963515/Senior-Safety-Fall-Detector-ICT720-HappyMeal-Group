import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "happymeal_db")

RAW_COLLECTION = os.getenv("RAW_COLLECTION", "raw_data")
PRED_COLLECTION = os.getenv("PRED_COLLECTION", "sensor_data")
STATE_COLLECTION = os.getenv("STATE_COLLECTION", "model_worker_state")

# Optional field if later you have multiple devices, e.g. device_id
RAW_STREAM_FIELD = os.getenv("RAW_STREAM_FIELD", "").strip()

WORKER_NAME = os.getenv("WORKER_NAME", "fall_model_worker")
POLL_INTERVAL_SEC = float(os.getenv("POLL_INTERVAL_SEC", "1"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "200"))

MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "fall_rf_model.joblib"))
CONFIG_PATH = os.getenv("CONFIG_PATH", str(BASE_DIR / "models" / "model_config.json"))