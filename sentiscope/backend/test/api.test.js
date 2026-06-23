/**
 * api.test.js
 * -----------
 * Lightweight integration tests using Node's built-in test runner.
 * These focus on request validation, which does NOT require the ML service
 * to be running (invalid requests are rejected before any ML call).
 *
 * Run:  npm test
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.PORT = "5099"; // dedicated test port
const { server } = await import("../src/server.js");

const BASE = "http://localhost:5099";

before(async () => {
  // server.js calls app.listen on import; give it a moment to bind.
  await new Promise((r) => setTimeout(r, 300));
});

after(() => {
  if (server) server.close();
});

test("POST /api/analyze rejects empty text", async () => {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "   " }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /text/i);
});

test("POST /api/analyze/batch rejects non-array", async () => {
  const res = await fetch(`${BASE}/api/analyze/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: "not-an-array" }),
  });
  assert.equal(res.status, 400);
});

test("GET /api/stats returns a total and byLabel array", async () => {
  const res = await fetch(`${BASE}/api/stats`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(typeof body.total, "number");
  assert.ok(Array.isArray(body.byLabel));
});

test("GET /api/health reports status", async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
  assert.equal(typeof body.mlServiceReachable, "boolean");
});
