from pymongo import MongoClient, ASCENDING
from app.config import (
    MONGO_URI, MONGO_DB, RAW_COLLECTION, PRED_COLLECTION,
    STATE_COLLECTION
)

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

raw_col = db[RAW_COLLECTION]
pred_col = db[PRED_COLLECTION]
state_col = db[STATE_COLLECTION]

def init_indexes():
    pred_col.create_index([("source_raw_id", ASCENDING)], unique=True)
    raw_col.create_index([("timestamp", ASCENDING)])
    state_col.create_index([("_id", ASCENDING)], unique=True)

def get_state(worker_name: str):
    return state_col.find_one({"_id": worker_name})

def set_state(worker_name: str, last_raw_id: str):
    state_col.update_one(
        {"_id": worker_name},
        {"$set": {"last_raw_id": last_raw_id}},
        upsert=True
    )