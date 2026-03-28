import json
import joblib
import pandas as pd

from app.config import MODEL_PATH, CONFIG_PATH
from app.preprocess import add_derived_features, window_to_feature_vector

class FallModelService:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        with open(CONFIG_PATH, "r") as f:
            self.cfg = json.load(f)

    def predict_from_raw_window(self, raw_window_df: pd.DataFrame) -> dict:
        if len(raw_window_df) < self.cfg["window_size"]:
            return {"ready": False, "reason": "not enough rows"}

        df = raw_window_df.copy().reset_index(drop=True)
        df = add_derived_features(df)

        # Skip broken windows with huge time gap
        if (df["diff_time"].iloc[1:] > self.cfg["max_gap_ms"]).any():
            return {"ready": False, "reason": "window gap too large"}

        feature_dict = window_to_feature_vector(df, self.cfg["base_feature_cols"])
        x_df = pd.DataFrame([feature_dict])[self.cfg["feature_names"]]

        # Use .values to avoid sklearn feature-name warning
        prob_fall = float(self.model.predict_proba(x_df.values)[0, 1])
        pred = 1 if prob_fall >= self.cfg["best_threshold"] else 0

        confidence_pct = round((prob_fall if pred == 1 else 1 - prob_fall) * 100, 2)

        last_row = df.iloc[-1].to_dict()

        return {
            "ready": True,
            "prediction": pred,
            "prediction_label": "Fall" if pred == 1 else "Not Fall",
            "prob_fall": round(prob_fall, 6),
            "confidence": confidence_pct,
            "threshold": self.cfg["best_threshold"],
            "window_size": self.cfg["window_size"],
            "last_row": last_row
        }