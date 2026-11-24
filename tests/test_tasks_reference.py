"""
Testy jednostkowe weryfikujące poprawność rozwiązań wzorcowych (reference solutions)
oraz testów dla wszystkich 5 zadań z bibliotek NumPy i Scikit-Learn.
"""
import pytest
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification


# Zadanie 1: Normalizacja Min-Max
def min_max_scale_ref(X: np.ndarray, feature_range: tuple = (0, 1)) -> np.ndarray:
    min_val, max_val = feature_range
    x_min = np.min(X, axis=0, keepdims=True)
    x_max = np.max(X, axis=0, keepdims=True)
    
    diff = x_max - x_min
    safe_diff = np.where(diff == 0, 1.0, diff)
    
    scaled = ((X - x_min) / safe_diff) * (max_val - min_val) + min_val
    scaled = np.where(diff == 0, min_val, scaled)
    return scaled


def test_task_1_min_max_scaling():
    X = np.array([
        [10.0, 200.0, 3.0],
        [20.0, 100.0, 1.0],
        [30.0, 300.0, 5.0]
    ])
    # Zakres [0, 1]
    res1 = min_max_scale_ref(X, (0, 1))
    assert res1.shape == X.shape
    assert np.allclose(res1.min(axis=0), [0.0, 0.0, 0.0])
    assert np.allclose(res1.max(axis=0), [1.0, 1.0, 1.0])

    # Zakres [-1, 1]
    res2 = min_max_scale_ref(X, (-1, 1))
    assert np.allclose(res2.min(axis=0), [-1.0, -1.0, -1.0])
    assert np.allclose(res2.max(axis=0), [1.0, 1.0, 1.0])

    # Ochrona przed dzieleniem przez zero (stala kolumna)
    X_const = np.array([[5.0, 1.0], [5.0, 2.0], [5.0, 3.0]])
    res_const = min_max_scale_ref(X_const, (0, 1))
    assert not np.isnan(res_const).any()
    assert np.allclose(res_const[:, 0], 0.0)


# Zadanie 2: Dense Layer
class DenseLayerRef:
    def __init__(self, in_features: int, out_features: int):
        self.in_features = in_features
        self.out_features = out_features
        self.W = np.random.randn(in_features, out_features) * 0.01
        self.b = np.zeros((1, out_features))

    def forward(self, X: np.ndarray) -> np.ndarray:
        return X @ self.W + self.b


def test_task_2_dense_layer():
    layer = DenseLayerRef(8, 4)
    X = np.ones((16, 8))
    out = layer.forward(X)
    assert out.shape == (16, 4)

    # Iloczyn deterministyczny
    det_layer = DenseLayerRef(2, 3)
    det_layer.W = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
    det_layer.b = np.array([[0.1, 0.2, 0.3]])
    X_det = np.array([[1.0, 2.0], [0.0, 1.0]])
    res = det_layer.forward(X_det)
    expected = np.array([[9.1, 12.2, 15.3], [4.1, 5.2, 6.3]])
    assert np.allclose(res, expected)


# Zadanie 3: Stable Softmax
def stable_softmax_ref(logits: np.ndarray, axis: int = -1) -> np.ndarray:
    max_val = np.max(logits, axis=axis, keepdims=True)
    shifted = logits - max_val
    exp_logits = np.exp(shifted)
    sum_exp = np.sum(exp_logits, axis=axis, keepdims=True)
    return exp_logits / sum_exp


def test_task_3_stable_softmax():
    z = np.array([2.0, 1.0, 0.1])
    probs = stable_softmax_ref(z)
    assert np.isclose(probs.sum(), 1.0)
    assert (probs >= 0).all() and (probs <= 1).all()

    # Ekstremalnie duze logity (brak overflow)
    z_huge = np.array([1000.0, 1001.0, 1002.0])
    probs_huge = stable_softmax_ref(z_huge)
    assert not np.isnan(probs_huge).any()
    assert not np.isinf(probs_huge).any()
    assert np.isclose(probs_huge.sum(), 1.0)


# Zadanie 4: Scikit-learn Pipeline
def build_and_evaluate_pipeline_ref(X: np.ndarray, y: np.ndarray) -> dict:
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, f1_score
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=500, random_state=42))
    ])
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")
    return {
        "pipeline": pipeline,
        "accuracy": float(acc),
        "f1": float(f1),
        "y_pred": y_pred
    }


def test_task_4_sklearn_pipeline():
    X, y = make_classification(n_samples=200, n_features=10, n_classes=2, random_state=42)
    res = build_and_evaluate_pipeline_ref(X, y)
    pipe = res["pipeline"]
    assert isinstance(pipe, Pipeline)
    assert "scaler" in [name for name, _ in pipe.steps]
    assert "classifier" in [name for name, _ in pipe.steps]
    scaler = pipe.named_steps["scaler"]
    # Brak data leakage: scaler przetworzyl dokladnie 150 probek (200 * 0.75)
    assert scaler.n_samples_seen_ == 150
    assert 0.0 <= res["accuracy"] <= 1.0
    assert 0.0 <= res["f1"] <= 1.0


# Zadanie 5: Gradient Descent
def gradient_descent_step_ref(X, y, w, b, learning_rate=0.01):
    N = X.shape[0]
    w_flat = w.reshape(-1)
    y_flat = y.reshape(-1)
    y_hat = (X @ w_flat) + b
    error = y_hat - y_flat
    loss = 0.5 * np.mean(error ** 2)
    dw = (X.T @ error) / N
    db = float(np.sum(error) / N)
    new_w = w_flat - learning_rate * dw
    new_b = b - learning_rate * db
    return new_w, float(new_b), float(loss)


def test_task_5_gradient_descent():
    X = np.array([[1.0], [2.0]])
    y = np.array([2.0, 4.0])
    w = np.array([0.0])
    b = 0.0
    w_next, b_next, loss = gradient_descent_step_ref(X, y, w, b, learning_rate=0.1)
    assert np.isclose(w_next[0], 0.5)
    assert np.isclose(b_next, 0.3)


# Zadanie 6: StratifiedKFold i F1-Score dla niezbalansowanych klas
def evaluate_imbalanced_cv_ref(X: np.ndarray, y: np.ndarray, n_splits: int = 5) -> dict:
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(class_weight="balanced", max_iter=500, random_state=42))
    ])
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1")
    return {
        "mean_f1": float(np.mean(scores)),
        "std_f1": float(np.std(scores)),
        "scores": scores,
        "cv": cv,
        "pipeline": pipeline
    }


def test_task_6_stratified_cv():
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    X, y = make_classification(
        n_samples=250,
        n_features=8,
        n_informative=5,
        weights=[0.88, 0.12],
        random_state=42
    )
    res = evaluate_imbalanced_cv_ref(X, y, n_splits=5)
    assert isinstance(res["cv"], StratifiedKFold)
    assert isinstance(res["pipeline"], Pipeline)
    clf = res["pipeline"].named_steps["classifier"]
    assert clf.class_weight == "balanced"
    expected_f1 = cross_val_score(res["pipeline"], X, y, cv=res["cv"], scoring="f1")
    assert np.allclose(res["scores"], expected_f1)
    assert len(res["scores"]) == 5
    assert 0.0 <= res["mean_f1"] <= 1.0
