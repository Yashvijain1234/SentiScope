/**
 * mlClient.js
 * -----------
 * Thin wrapper around the Python ML microservice. The backend never runs the
 * model itself; it forwards text to the ML service and returns its predictions.
 * Using the built-in global `fetch` (Node 18+), so no extra HTTP dependency.
 */
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function postJson(path, body) {
  const res = await fetch(`${ML_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`ML service responded ${res.status}: ${detail}`);
  }
  return res.json();
}

export async function predict(text) {
  return postJson("/predict", { text });
}

export async function predictBatch(texts) {
  return postJson("/predict-batch", { texts });
}

export async function checkHealth() {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
