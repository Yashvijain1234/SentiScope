"""
app.py
------
FastAPI microservice that serves the trained sentiment model.

Endpoints:
  GET  /health        -> simple health check
  POST /predict       -> classify a single piece of text
  POST /predict-batch -> classify many texts at once

The /predict response also returns the words that pushed the prediction
toward its result, which makes the model's decision interpretable.

Run:  uvicorn app:app --reload --port 8000
"""

import os
from typing import List

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "sentiment_model.joblib")

app = FastAPI(
    title="SentiScope ML Service",
    description="Sentiment analysis for product reviews (TF-IDF + Logistic Regression).",
    version="1.0.0",
)

# Allow the Node backend (and local dev) to call this service.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            f"Model not found at {MODEL_PATH}. "
            "Run `python generate_dataset.py && python train.py` first."
        )
    model = joblib.load(MODEL_PATH)


@app.on_event("startup")
def startup_event():
    load_model()


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, description="The review text to analyze.")


class BatchRequest(BaseModel):
    texts: List[str] = Field(..., description="A list of review texts to analyze.")


def _top_influential_words(text: str, predicted_label: str, k: int = 5):
    """Return the words in `text` that most pushed the model toward its label.

    We multiply each present word's TF-IDF value by the classifier's learned
    weight for the predicted class. Highest products = most influential words.
    """
    try:
        vectorizer = model.named_steps["tfidf"]
        clf = model.named_steps["clf"]

        # Index of the predicted class in the classifier.
        class_idx = list(clf.classes_).index(predicted_label)
        # coef_ shape depends on the number of classes:
        #   - binary    -> (1, n_features), the row points toward classes_[1]
        #   - multiclass -> (n_classes, n_features), one row per class
        # For multiclass we use the row for the predicted class directly; for
        # binary we flip the single row when the negative class is predicted.
        if clf.coef_.shape[0] == 1:
            coefs = clf.coef_[0]
            if predicted_label == clf.classes_[0]:
                coefs = -coefs  # flip toward the negative class
        else:
            coefs = clf.coef_[class_idx]

        feature_names = vectorizer.get_feature_names_out()
        row = vectorizer.transform([text])
        row = row.tocoo()

        contributions = []
        for idx, val in zip(row.col, row.data):
            contributions.append((feature_names[idx], float(val * coefs[idx])))

        contributions.sort(key=lambda x: x[1], reverse=True)
        return [w for w, score in contributions[:k] if score > 0]
    except Exception:
        return []


def _classify(text: str):
    proba = model.predict_proba([text])[0]
    classes = list(model.classes_)
    best_idx = int(np.argmax(proba))
    label = classes[best_idx]
    confidence = float(proba[best_idx])
    scores = {cls: float(p) for cls, p in zip(classes, proba)}
    return {
        "text": text,
        "label": label,
        "confidence": round(confidence, 4),
        "scores": {k: round(v, 4) for k, v in scores.items()},
        "influential_words": _top_influential_words(text, label),
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return _classify(req.text)


@app.post("/predict-batch")
def predict_batch(req: BatchRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    if not req.texts:
        raise HTTPException(status_code=400, detail="`texts` must not be empty.")
    return {"results": [_classify(t) for t in req.texts]}
