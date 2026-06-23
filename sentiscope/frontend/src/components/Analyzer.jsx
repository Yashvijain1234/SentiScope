/**
 * Analyzer
 * --------
 * The main interaction surface. Supports two modes:
 *   - Single: analyze one review.
 *   - Batch:  analyze many reviews at once (one per line).
 */
import { useState } from "react";
import { analyze, analyzeBatch } from "../api.js";
import ResultCard from "./ResultCard.jsx";

const EXAMPLES = [
  "This phone is incredible — the camera is stunning and the battery lasts all day.",
  "Terrible experience. It broke within a week and support never replied.",
  "It's okay I guess, shipping was slow but the product works fine.",
];

export default function Analyzer({ onAnalyzed }) {
  const [mode, setMode] = useState("single");
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setError("");
    setLoading(true);
    setResults([]);
    try {
      if (mode === "single") {
        if (!text.trim()) throw new Error("Please enter some text to analyze.");
        const r = await analyze(text.trim());
        setResults([r]);
      } else {
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) throw new Error("Enter at least one review (one per line).");
        const { results: rs } = await analyzeBatch(lines);
        setResults(rs);
      }
      onAnalyzed?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card analyzer">
      <div className="mode-toggle">
        <button
          className={mode === "single" ? "active" : ""}
          onClick={() => setMode("single")}
        >
          Single review
        </button>
        <button
          className={mode === "batch" ? "active" : ""}
          onClick={() => setMode("batch")}
        >
          Batch (one per line)
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === "single"
            ? "Paste a product review here..."
            : "Paste multiple reviews, one per line..."
        }
        rows={mode === "single" ? 4 : 7}
      />

      <div className="examples">
        <span>Try an example:</span>
        {EXAMPLES.map((ex, i) => (
          <button key={i} className="example-chip" onClick={() => setText(ex)}>
            Example {i + 1}
          </button>
        ))}
      </div>

      <button className="primary-btn" onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze sentiment"}
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="results-list">
        {results.map((r, i) => (
          <ResultCard key={i} result={r} />
        ))}
      </div>
    </section>
  );
}
