/**
 * api.js
 * ------
 * Small wrapper around the backend REST API. All requests use relative URLs;
 * Vite's dev server proxies /api to the Node backend (see vite.config.js).
 */
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const analyze = (text) =>
  request("/analyze", { method: "POST", body: JSON.stringify({ text }) });

export const analyzeBatch = (texts) =>
  request("/analyze/batch", { method: "POST", body: JSON.stringify({ texts }) });

export const getHistory = (limit = 20) => request(`/history?limit=${limit}`);

export const getStats = () => request("/stats");

export const clearHistory = () => request("/history", { method: "DELETE" });

export const getHealth = () => request("/health");
