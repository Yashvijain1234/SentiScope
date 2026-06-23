/**
 * routes/analyze.js
 * -----------------
 * REST endpoints for analyzing text and reading history/stats.
 *
 *   POST /api/analyze        { text }            -> single prediction (saved)
 *   POST /api/analyze/batch  { texts: [...] }    -> many predictions (saved)
 *   GET  /api/history?limit= 						-> recent analyses
 *   GET  /api/stats          					-> aggregate counts
 *   DELETE /api/history      					-> clear history
 */
import { Router } from "express";
import { predict, predictBatch } from "../mlClient.js";
import { saveAnalysis, getRecent, getStats, clearHistory } from "../db.js";

const router = Router();

router.post("/analyze", async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "`text` is required and must be a non-empty string." });
    }
    const result = await predict(text.trim());
    saveAnalysis({ text: result.text, label: result.label, confidence: result.confidence });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/analyze/batch", async (req, res, next) => {
  try {
    const { texts } = req.body || {};
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "`texts` must be a non-empty array of strings." });
    }
    const clean = texts.map((t) => String(t).trim()).filter((t) => t.length > 0);
    if (clean.length === 0) {
      return res.status(400).json({ error: "No valid (non-empty) texts provided." });
    }
    const { results } = await predictBatch(clean);
    for (const r of results) {
      saveAnalysis({ text: r.text, label: r.label, confidence: r.confidence });
    }
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

router.get("/history", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  res.json({ history: getRecent(limit) });
});

router.get("/stats", (req, res) => {
  res.json(getStats());
});

router.delete("/history", (req, res) => {
  clearHistory();
  res.json({ ok: true });
});

export default router;
