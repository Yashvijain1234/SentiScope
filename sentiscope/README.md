# SentiScope — AI Product-Review Sentiment Analyzer

A full-stack web application that analyzes the sentiment of product reviews in
real time using a **custom-trained machine learning model**. Built to
demonstrate end-to-end engineering skills: a clean ML pipeline, a service-based
backend architecture, and a polished React frontend.

> **Stack:** React (Vite) · Node.js / Express · Python (scikit-learn) · FastAPI · SQLite

---

## Why this project

It was built to showcase three things that matter for a software/ML internship:

1. **ML fundamentals** — the sentiment model is trained from scratch (data →
   features → model → evaluation), not just an API call. It uses a
   TF-IDF + Logistic Regression pipeline and reports real metrics.
2. **System design** — a clean three-tier architecture where each service has a
   single responsibility and communicates over HTTP.
3. **Product polish** — a responsive, modern UI with live charts, batch
   processing, history persistence, and a service-health indicator.

---

## Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌────────────────────────┐
│   React (Vite)  │  ─▶  │  Node.js / Express   │  ─▶  │  Python ML service     │
│   Port 5173     │ HTTP │  Port 5050           │ HTTP │  (FastAPI) Port 8000   │
│                 │      │                      │      │                        │
│ • Analyzer UI   │      │ • REST API           │      │ • TF-IDF + LogReg      │
│ • Dashboard     │  ◀─  │ • SQLite history     │  ◀─  │ • /predict             │
│ • Charts        │      │ • Input validation   │      │ • /predict-batch       │
└─────────────────┘      └──────────────────────┘      └────────────────────────┘
```

- The **frontend** never talks to the ML service directly — it goes through the
  Node backend, which is responsible for the public API, validation, and
  storing analysis history.
- The **backend** is a thin, well-structured Express app that proxies prediction
  requests to the ML service and persists results in SQLite.
- The **ML service** owns the model: it loads the trained pipeline and serves
  predictions, including a confidence score and the words that most influenced
  each decision (interpretability).

---

## Features

- **Single & batch analysis** — analyze one review or many at once.
- **Confidence scores** — every prediction includes a probability.
- **Explainability** — see the key words that drove each prediction.
- **Live analytics dashboard** — sentiment breakdown pie chart, headline stats,
  and a positive-rate metric that update after every analysis.
- **Persistent history** — all analyses are stored in SQLite (via Node's
  built-in `node:sqlite`, no native build step).
- **Service-health indicator** — the UI shows whether the backend and ML
  service are reachable.

---

## Machine learning details

| Aspect            | Choice                                                      |
| ----------------- | ----------------------------------------------------------- |
| Task              | Binary sentiment classification (positive / negative)       |
| Features          | TF-IDF over unigrams + bigrams (captures phrases like "not good") |
| Model             | Logistic Regression                                          |
| Train/test split  | 80 / 20, stratified                                          |
| Test accuracy     | ~93% on a held-out set                                      |
| Interpretability  | Per-prediction top influential words                         |

The dataset is generated programmatically (`generate_dataset.py`) from a rich
set of templates, including **deliberately ambiguous, mixed-sentiment reviews
and a small amount of label noise** so the model learns genuine signal rather
than memorizing keywords — which is why accuracy is a realistic ~93% rather than
a suspicious 100%. In a production setting you would swap this for a public
corpus such as IMDB or Amazon Reviews; the training code would not change.

---

## Getting started

### Prerequisites

- **Node.js** 22+ (uses the built-in `node:sqlite` module)
- **Python** 3.10+

### 1. ML service

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python generate_dataset.py        # create the training data
python train.py                   # train + save the model
uvicorn app:app --port 8000       # start the ML API
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start                         # http://localhost:5050
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Then open **http://localhost:5173**.

### One-command dev (macOS/Linux)

After installing dependencies once, you can start all three services together:

```bash
bash scripts/dev.sh
```

---

## API reference (backend)

| Method | Endpoint              | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| POST   | `/api/analyze`        | Analyze a single `{ text }`              |
| POST   | `/api/analyze/batch`  | Analyze `{ texts: [...] }`               |
| GET    | `/api/history?limit=` | Recent analyses                          |
| GET    | `/api/stats`          | Aggregate counts by sentiment            |
| DELETE | `/api/history`        | Clear stored history                     |
| GET    | `/api/health`         | Backend + ML service health              |

Example:

```bash
curl -X POST http://localhost:5050/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "The battery life is amazing and it feels premium."}'
```

---

## Testing

```bash
cd backend && npm test     # API validation & health tests (Node test runner)
```

The ML pipeline prints a full classification report and confusion matrix when
you run `python train.py`.

---

## Project structure

```
sentiscope/
├── ml-service/            # Python ML model + FastAPI service
│   ├── generate_dataset.py
│   ├── train.py
│   ├── app.py
│   └── requirements.txt
├── backend/               # Node.js / Express API
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── mlClient.js
│   │   └── routes/analyze.js
│   └── test/api.test.js
├── frontend/              # React (Vite) single-page app
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
└── scripts/dev.sh         # start everything
```

---

## Possible extensions

- Swap the synthetic dataset for a real corpus (IMDB / Amazon Reviews).
- Add a neutral class for 3-way classification.
- Containerize each service with Docker + docker-compose.
- Add user accounts and per-user history.
- Deploy: frontend to Vercel, backend to Render, ML service to a small GPU/CPU host.

---

## License

MIT
