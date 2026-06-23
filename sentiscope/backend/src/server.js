/**
 * server.js
 * ---------
 * Express application entry point. Wires up middleware (CORS, JSON parsing,
 * request logging), mounts the API routes, and exposes a health check that
 * also reports whether the downstream ML service is reachable.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import analyzeRoutes from "./routes/analyze.js";
import { checkHealth } from "./mlClient.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Ensure the SQLite data directory exists before db.js opens the file.
mkdirSync(join(__dirname, "..", "data"), { recursive: true });

const app = express();
const PORT = process.env.PORT || 5050;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", async (_req, res) => {
  const mlUp = await checkHealth();
  res.json({ status: "ok", mlServiceReachable: mlUp });
});

app.use("/api", analyzeRoutes);

// Centralized error handler so route handlers can just call next(err).
app.use((err, _req, res, _next) => {
  console.error(err);
  const isMlDown = /fetch failed|ECONNREFUSED|ML service/.test(err.message || "");
  res.status(isMlDown ? 502 : 500).json({
    error: isMlDown
      ? "Could not reach the ML service. Is it running on its port?"
      : "Internal server error.",
    detail: err.message,
  });
});

const server = app.listen(PORT, () => {
  console.log(`SentiScope backend running on http://localhost:${PORT}`);
});

export { server };
export default app;
