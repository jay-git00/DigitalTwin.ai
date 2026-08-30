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
from typing import Optional, Union

ARTIFACT_DIR = Path(__file__).parent / "artifacts"
N_STATIONS = 45
SEQ_LEN = 30          # 30-minute lookback window
HORIZON_MINUTES = 45  # predict bottleneck within this window
BOTTLENECK_THRESHOLD = 1.35  # cycle_time > 135% of station mean = bottleneck


@dataclass
class BottleneckPrediction:
    station_id: int
    bottleneck_prob: float
    eta_minutes: int
    confidence: float


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -15.0, 15.0)))


def _lstm_step(
    x: np.ndarray,
    h_prev: np.ndarray,
    c_prev: np.ndarray,
    w_ih: np.ndarray,
    w_hh: np.ndarray,
    b_ih: np.ndarray,
    b_hh: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    gates = (x @ w_ih.T + b_ih) + (h_prev @ w_hh.T + b_hh)
    hidden_dim = h_prev.shape[-1]
    i = _sigmoid(gates[:hidden_dim])
    f = _sigmoid(gates[hidden_dim : 2 * hidden_dim])
    g = np.tanh(gates[2 * hidden_dim : 3 * hidden_dim])
    o = _sigmoid(gates[3 * hidden_dim :])
    c = f * c_prev + i * g
    h = o * np.tanh(c)
    return h, c


def _lstm_layer(
    x_seq: np.ndarray,
    w_ih: np.ndarray,
    w_hh: np.ndarray,
    b_ih: np.ndarray,
    b_hh: np.ndarray,
) -> np.ndarray:
    hidden_dim = w_hh.shape[1]
    h = np.zeros(hidden_dim, dtype=np.float32)
    c = np.zeros(hidden_dim, dtype=np.float32)
    outputs = []
    for t in range(x_seq.shape[0]):
        h, c = _lstm_step(x_seq[t], h, c, w_ih, w_hh, b_ih, b_hh)
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

    def predict(self, recent_input: Union[pd.DataFrame, dict]) -> list[BottleneckPrediction]:
        if self.weights is None:
            self.load()

        if self.weights is None or self.station_means is None:
            return []

        if isinstance(recent_input, dict):
            # Fast path: dict of station_id -> list of event dicts
            vals_rows = []
            max_len = max((len(w) for w in recent_input.values()), default=0)
            if max_len == 0:
                return []
            start_idx = max(0, max_len - SEQ_LEN)
            for t in range(start_idx, max_len):
                row = []
                for sid in range(1, N_STATIONS + 1):
                    win = recent_input.get(sid, [])
                    if t < len(win):
                        row.append(float(win[t].get("cycle_time_s", 60.0)))
                    elif win:
                        row.append(float(win[-1].get("cycle_time_s", 60.0)))
                    else:
                        row.append(60.0)
                vals_rows.append(row)
            vals = np.array(vals_rows, dtype=np.float32)
        else:
            pivot = (
                recent_input.pivot_table(index="vehicle_id", columns="station_id", values="cycle_time_s")
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
