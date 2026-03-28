import logging
from bson import ObjectId
import pandas as pd
from pymongo.errors import DuplicateKeyError

from app.config import (
    RAW_STREAM_FIELD, WORKER_NAME, BATCH_SIZE
)
from app.db import raw_col, pred_col, get_state, set_state
from app.model_service import FallModelService

logger = logging.getLogger(__name__)

class FallWorker:
    def __init__(self):
        self.model_service = FallModelService()
        self.window_size = self.model_service.cfg["window_size"]

    def _get_new_raw_docs(self):
        state = get_state(WORKER_NAME)
        query = {}

        if state and state.get("last_raw_id"):
            query["_id"] = {"$gt": ObjectId(state["last_raw_id"])}

        docs = list(raw_col.find(query).sort("_id", 1).limit(BATCH_SIZE))
        return docs

    def _get_window_docs_for_current(self, current_doc):
        query = {"_id": {"$lte": current_doc["_id"]}}

        # If later you add device_id or stream_id, set RAW_STREAM_FIELD=device_id in .env
        if RAW_STREAM_FIELD and RAW_STREAM_FIELD in current_doc:
            query[RAW_STREAM_FIELD] = current_doc[RAW_STREAM_FIELD]

        docs = list(
            raw_col.find(query)
            .sort("_id", -1)
            .limit(self.window_size)
        )
        docs.reverse()
        return docs

    def _raw_docs_to_df(self, docs):
        rows = []
        for d in docs:
            rows.append({
                "timestamp": d.get("timestamp"),
                "tstamp": d.get("tstamp"),
                "ax": float(d["ax"]),
                "ay": float(d["ay"]),
                "az": float(d["az"]),
                "gx": float(d["gx"]),
                "gy": float(d["gy"]),
                "gz": float(d["gz"]),
            })
        return pd.DataFrame(rows)

    def _build_prediction_doc(self, current_doc, pred_result):
        last_row = pred_result["last_row"]

        out = {
            "source_raw_id": current_doc["_id"],
            "tstamp": current_doc.get("tstamp"),
            "ax": round(float(last_row["ax"]), 6),
            "ay": round(float(last_row["ay"]), 6),
            "az": round(float(last_row["az"]), 6),
            "gx": round(float(last_row["gx"]), 6),
            "gy": round(float(last_row["gy"]), 6),
            "gz": round(float(last_row["gz"]), 6),

            "mag_acc": round(float(last_row["mag_acc"]), 6),
            "mag_gyro": round(float(last_row["mag_gyro"]), 6),
            "diff_acc": round(float(last_row["diff_acc"]), 6),
            "diff_gyro": round(float(last_row["diff_gyro"]), 6),
            "diff_time": round(float(last_row["diff_time"]), 6),

            "prediction": int(pred_result["prediction"]),
            "confidence": pred_result["confidence"],      # predicted-class confidence (%)
            "prob_fall": pred_result["prob_fall"],        # optional but useful
            "threshold": pred_result["threshold"],
            "window_size": pred_result["window_size"],

            "timestamp": current_doc.get("timestamp")
        }

        if RAW_STREAM_FIELD and RAW_STREAM_FIELD in current_doc:
            out[RAW_STREAM_FIELD] = current_doc[RAW_STREAM_FIELD]

        return out

    def run_once(self):
        new_docs = self._get_new_raw_docs()
        if not new_docs:
            return 0

        processed = 0

        for current_doc in new_docs:
            window_docs = self._get_window_docs_for_current(current_doc)

            if len(window_docs) >= self.window_size:
                raw_window_df = self._raw_docs_to_df(window_docs)
                pred_result = self.model_service.predict_from_raw_window(raw_window_df)

                if pred_result["ready"]:
                    pred_doc = self._build_prediction_doc(current_doc, pred_result)

                    try:
                        pred_col.insert_one(pred_doc)
                    except DuplicateKeyError:
                        pass

            set_state(WORKER_NAME, str(current_doc["_id"]))
            processed += 1

        return processed