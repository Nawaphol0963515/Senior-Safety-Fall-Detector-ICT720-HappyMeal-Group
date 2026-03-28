import numpy as np
import pandas as pd

def _to_ms_from_timestamp(series: pd.Series) -> pd.Series:
    ts = pd.to_datetime(series, utc=True, errors="coerce")
    return (ts.astype("int64") // 10**6).astype("float64")

def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["mag_acc"] = np.sqrt(df["ax"]**2 + df["ay"]**2 + df["az"]**2)
    df["mag_gyro"] = np.sqrt(df["gx"]**2 + df["gy"]**2 + df["gz"]**2)

    df["diff_acc"] = df["mag_acc"].diff().fillna(0.0)
    df["diff_gyro"] = df["mag_gyro"].diff().fillna(0.0)

    # Prefer sensor-side tstamp if available
    if "tstamp" in df.columns and df["tstamp"].notna().all():
        df["diff_time"] = pd.to_numeric(df["tstamp"], errors="coerce").diff().fillna(0.0)
    else:
        df["diff_time"] = _to_ms_from_timestamp(df["timestamp"]).diff().fillna(0.0)

    return df

def window_to_feature_vector(window_df: pd.DataFrame, feature_cols: list[str]) -> dict:
    feats = {}

    for col in feature_cols:
        x = window_df[col].values.astype(float)

        feats[f"{col}_mean"] = float(np.mean(x))
        feats[f"{col}_std"] = float(np.std(x))
        feats[f"{col}_median"] = float(np.median(x))
        feats[f"{col}_min"] = float(np.min(x))
        feats[f"{col}_max"] = float(np.max(x))
        feats[f"{col}_range"] = float(np.max(x) - np.min(x))
        feats[f"{col}_absmax"] = float(np.max(np.abs(x)))
        feats[f"{col}_delta"] = float(x[-1] - x[0])
        feats[f"{col}_rms"] = float(np.sqrt(np.mean(np.square(x))))
        feats[f"{col}_iqr"] = float(np.percentile(x, 75) - np.percentile(x, 25))

    return feats