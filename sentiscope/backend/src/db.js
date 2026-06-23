/**
 * db.js
 * -----
 * Persists every sentiment analysis so the frontend can show history and
 * aggregate stats.
 *
 * Uses Node's built-in SQLite module (`node:sqlite`, Node 22+). This avoids
 * any native-module compilation step and ships with the runtime. The API is
 * synchronous, which keeps this code simple and is perfectly fine for a
 * single-file local database like this one.
 */
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "data", "sentiscope.db");

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    text       TEXT    NOT NULL,
    label      TEXT    NOT NULL,
    confidence REAL    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertStmt = db.prepare(
  `INSERT INTO analyses (text, label, confidence) VALUES (?, ?, ?)`
);

const recentStmt = db.prepare(
  `SELECT id, text, label, confidence, created_at
     FROM analyses
    ORDER BY id DESC
    LIMIT ?`
);

const statsStmt = db.prepare(
  `SELECT label, COUNT(*) AS count, AVG(confidence) AS avg_confidence
     FROM analyses
    GROUP BY label`
);

const totalStmt = db.prepare(`SELECT COUNT(*) AS total FROM analyses`);

const clearStmt = db.prepare(`DELETE FROM analyses`);

export function saveAnalysis({ text, label, confidence }) {
  const info = insertStmt.run(text, label, confidence);
  return info.lastInsertRowid;
}

export function getRecent(limit = 20) {
  return recentStmt.all(limit);
}

export function getStats() {
  const byLabel = statsStmt.all();
  const { total } = totalStmt.get();
  return { total, byLabel };
}

export function clearHistory() {
  clearStmt.run();
}

export default db;
