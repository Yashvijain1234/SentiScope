"""
train.py
--------
Trains the sentiment-analysis model and saves it to disk.

ML pipeline:
  1. Load the labeled review dataset (text -> positive / negative).
  2. Split into train / test sets (stratified).
  3. Vectorize text with TF-IDF (converts words into numeric features,
     weighting rare-but-informative words higher than common ones).
  4. Train a Logistic Regression classifier (a simple, fast, interpretable
     model that works very well for text classification).
  5. Evaluate on the held-out test set and print accuracy + a full report.
  6. Save the trained pipeline to model/sentiment_model.joblib.

Run:  python train.py
"""

import os

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "data", "reviews.csv")
MODEL_DIR = os.path.join(HERE, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "sentiment_model.joblib")


def load_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. "
            "Run `python generate_dataset.py` first."
        )
    df = pd.read_csv(DATA_PATH)
    df = df.dropna()
    print(f"Loaded {len(df)} reviews.")
    print(df["label"].value_counts().to_string())
    return df


def build_pipeline():
    """TF-IDF features feeding into a Logistic Regression classifier."""
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    # NOTE: do NOT use stop_words="english" here. sklearn's
                    # English stop-word list contains negations ("not", "no",
                    # "never"), and they are removed *before* n-grams are built.
                    # That destroys the sentiment signal and prevents bigrams
                    # like "not good" from ever forming, making the model
                    # misclassify negated phrases (e.g. "this is not good").
                    stop_words=None,
                    ngram_range=(1, 2),  # unigrams + bigrams (e.g. "not good")
                    min_df=2,
                    max_features=20000,
                ),
            ),
            (
                "clf",
                LogisticRegression(max_iter=1000, C=5.0),
            ),
        ]
    )


def main():
    df = load_data()

    X_train, X_test, y_train, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=0.2,
        random_state=42,
        stratify=df["label"],
    )
    print(f"\nTrain size: {len(X_train)}  |  Test size: {len(X_test)}")

    pipeline = build_pipeline()
    print("\nTraining model...")
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)

    print(f"\n=== Evaluation on held-out test set ===")
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification report:")
    print(classification_report(y_test, preds))
    print("Confusion matrix (rows=true, cols=pred):")
    print(confusion_matrix(y_test, preds))

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nSaved trained model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
