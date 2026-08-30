"""
models/bottleneck_predictor.py — Ultra-lightweight LSTM bottleneck predictor.

Predicts which station(s) will form a bottleneck in the next 30–60 minutes
by learning temporal patterns in cycle_time sequences across all stations.

Uses pure NumPy matrix math for inference to run on Render free tier (<100MB RAM),
with optional PyTorch support for training.
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

ARTIFACT_DIR = Path(__file__).parent / "artifacts"
N_STATIONS = 45
SEQ_LEN = 30          # 30-minute lookback window
HORIZON_MINUTES = 45  # predict bottleneck within this window
BOTTLENECK_THRESHOLD = 1.35  # cycle_time > 135% of station mean = bottleneck


@dataclass
class BottleneckPrediction:
    station_id: int
    bottleneck_prob: float
    eta_minutes: Optional[int]
    confidence: float


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -30, 30)))


def _lstm_layer(x: np.ndarray, w_ih: np.ndarray, w_hh: np.ndarray, b_ih: np.ndarray, b_hh: np.ndarray) -> np.ndarray:
    """Pure NumPy 1D/2D LSTM layer forward pass."""
    seq_len, _ = x.shape
    hidden_size = w_ih.shape[0] // 4
    h = np.zeros(hidden_size, dtype=np.float32)
    c = np.zeros(hidden_size, dtype=np.float32)

    outputs = []
    for t in range(seq_len):
        gates = (x[t] @ w_ih.T + b_ih) + (h @ w_hh.T + b_hh)
        i = _sigmoid(gates[0:hidden_size])
        f = _sigmoid(gates[hidden_size:2*hidden_size])
        g = np.tanh(gates[2*hidden_size:3*hidden_size])
        o = _sigmoid(gates[3*hidden_size:4*hidden_size])

        c = f * c + i * g
        h = o * np.tanh(c)
        outputs.append(h)
    return np.array(outputs, dtype=np.float32)


class BottleneckPredictor:
    def __init__(self, device: Optional[str] = None):
        self.weights: Optional[dict[str, np.ndarray]] = None
        self.station_means: Optional[np.ndarray] = None
        self.station_stds: Optional[np.ndarray] = None

    def load(self):
        # Load NumPy weights artifact for zero-overhead inference
        npz_path = ARTIFACT_DIR / "bottleneck_lstm_weights.npz"
        if npz_path.exists():
            data = np.load(npz_path)
            self.weights = {k: data[k] for k in data.files}
        else:
            # Fallback to PyTorch load if .pt exists
            try:
                import torch
                pt_path = ARTIFACT_DIR / "bottleneck_lstm.pt"
                if pt_path.exists():
                    state = torch.load(pt_path, map_location="cpu")
                    self.weights = {k: v.numpy() for k, v in state.items()}
            except ImportError:
                pass

        scaler_path = ARTIFACT_DIR / "bottleneck_scaler.pkl"
        if scaler_path.exists():
            scaler = joblib.load(scaler_path)
            self.station_means = scaler["means"]
            self.station_stds  = scaler["stds"]

        return self

    def predict(self, recent_df: pd.DataFrame) -> list[BottleneckPrediction]:
        if self.weights is None:
            self.load()

        if self.weights is None or self.station_means is None:
            return []

        pivot = (
            recent_df.pivot_table(index="vehicle_id", columns="station_id", values="cycle_time_s")
            .sort_index()
            .ffill()
            .bfill()
        )
        for sid in range(1, N_STATIONS + 1):
            if sid not in pivot.columns:
                pivot[sid] = 0.0
        pivot = pivot[[i for i in range(1, N_STATIONS + 1)]]

        vals = pivot.values[-SEQ_LEN:].astype(np.float32)
        if len(vals) < SEQ_LEN:
            pad = np.zeros((SEQ_LEN - len(vals), N_STATIONS), dtype=np.float32)
            vals = np.vstack([pad, vals])

        vals_norm = (vals - self.station_means) / (self.station_stds + 1e-6)

        # Pure NumPy 2-layer LSTM + FC inference
        l0 = _lstm_layer(
            vals_norm,
            self.weights["lstm.weight_ih_l0"],
            self.weights["lstm.weight_hh_l0"],
            self.weights["lstm.bias_ih_l0"],
            self.weights["lstm.bias_hh_l0"]
        )
        l1 = _lstm_layer(
            l0,
            self.weights["lstm.weight_ih_l1"],
            self.weights["lstm.weight_hh_l1"],
            self.weights["lstm.bias_ih_l1"],
            self.weights["lstm.bias_hh_l1"]
        )
        last_h = l1[-1]
        fc_out = last_h @ self.weights["fc.weight"].T + self.weights["fc.bias"]
        probs = _sigmoid(fc_out)

        results = []
        for i, prob in enumerate(probs):
            if prob > 0.30:
                eta = int(HORIZON_MINUTES * (1.0 - prob))
                results.append(BottleneckPrediction(
                    station_id=i + 1,
                    bottleneck_prob=float(prob),
                    eta_minutes=max(5, eta),
                    confidence=float(prob),
                ))
        return sorted(results, key=lambda r: r.bottleneck_prob, reverse=True)
