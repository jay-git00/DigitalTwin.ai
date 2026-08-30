"""
models/anomaly_detector.py — Isolation Forest-based real-time anomaly
detection for assembly line station telemetry.

Trained on normal operating data; scores incoming windows for anomalies
without requiring pre-labelled fault data.
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from dataclasses import dataclass
from typing import Optional, Union

ARTIFACT_DIR = Path(__file__).parent / "artifacts"
FEATURES = ["cycle_time_s", "torque_nm", "vibration_g", "temperature_c"]
WINDOW_SIZE = 10  # rolling window of cycles per station


@dataclass
class AnomalyResult:
    station_id: int
    anomaly_score: float    # raw decision function score (higher = more normal)
    is_anomaly: bool
    contributing_features: dict[str, float]  # z-scores per feature


class AnomalyDetector:
    """
    Per-station Isolation Forest. Each station gets its own model because
    operating parameters differ significantly across zones.
    """

    def __init__(self, contamination: float = 0.04):
        """
        contamination: expected fraction of anomalies in training data.
        Set low (4%) to reduce false positives — trust erosion is a real risk.
        """
        self.contamination = contamination
        self.models: dict[int, IsolationForest] = {}
        self.scalers: dict[int, StandardScaler] = {}

    def fit(self, df: pd.DataFrame):
        """
        Train one Isolation Forest per station using normal operating data.
        df must have columns: station_id, cycle_time_s, torque_nm,
                              vibration_g, temperature_c
        Sensor-poor stations (no torque/vibration/temp) use cycle_time only.
        """
        ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
        for station_id, group in df.groupby("station_id"):
            available_features = [f for f in FEATURES if group[f].notna().any()]
            X = group[available_features].dropna()
            if len(X) < 50:
                continue  # not enough data

            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            model = IsolationForest(
                n_estimators=80,
                contamination=self.contamination,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_scaled)

            self.models[station_id] = model
            self.scalers[station_id] = scaler

        self.save()
        print(f"[AnomalyDetector] Trained on {len(self.models)} stations.")

    def predict(self, window_input: Union[pd.DataFrame, dict, list], station_id: int) -> AnomalyResult:
        """
        Score the latest window for a single station.
        window_input: latest event dict, list of event dicts, or DataFrame.
        Returns AnomalyResult with score and feature contributions.
        """
        if station_id not in self.models:
            return AnomalyResult(
                station_id=station_id,
                anomaly_score=0.0,
                is_anomaly=False,
                contributing_features={},
            )

        scaler = self.scalers[station_id]
        model = self.models[station_id]

        if isinstance(window_input, dict):
            latest_dict = window_input
        elif isinstance(window_input, list) and window_input:
            latest_dict = window_input[-1]
        elif isinstance(window_input, pd.DataFrame) and not window_input.empty:
            latest_dict = window_input.iloc[-1].to_dict()
        else:
            return AnomalyResult(
                station_id=station_id,
                anomaly_score=0.0,
                is_anomaly=False,
                contributing_features={},
            )

        available_features = [f for f in FEATURES if f in latest_dict and latest_dict[f] is not None]
        if not available_features:
            return AnomalyResult(
                station_id=station_id,
                anomaly_score=0.0,
                is_anomaly=False,
                contributing_features={},
            )

        row_vals = np.array([[float(latest_dict.get(f, 0.0) or 0.0) for f in available_features]], dtype=np.float32)
        X_scaled = scaler.transform(row_vals)

        # decision_function: negative = anomaly, positive = normal
        raw_score = float(model.decision_function(X_scaled)[0])
        is_anomaly = bool(model.predict(X_scaled)[0] == -1)

        # Per-feature z-score for explainability
        z_scores = {}
        for i, feat in enumerate(available_features):
            mean = scaler.mean_[i]
            std = scaler.scale_[i]
            val = float(latest_dict.get(feat, 0.0) or 0.0)
            z_scores[feat] = float((val - mean) / (std + 1e-9))

        return AnomalyResult(
            station_id=station_id,
            anomaly_score=raw_score,
            is_anomaly=is_anomaly,
            contributing_features=z_scores,
        )

    def save(self):
        ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.models, ARTIFACT_DIR / "anomaly_models.pkl")
        joblib.dump(self.scalers, ARTIFACT_DIR / "anomaly_scalers.pkl")

    def load(self):
        self.models = joblib.load(ARTIFACT_DIR / "anomaly_models.pkl")
        self.scalers = joblib.load(ARTIFACT_DIR / "anomaly_scalers.pkl")
        return self
