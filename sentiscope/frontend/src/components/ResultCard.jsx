/**
 * ResultCard
 * ----------
 * Displays a single analysis result: the predicted sentiment, a confidence
 * bar, and the words that most influenced the model's decision.
 */
const LABEL_META = {
  positive: { cls: "pos", emoji: "😊" },
  negative: { cls: "neg", emoji: "😞" },
  neutral: { cls: "neu", emoji: "😐" },
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const meta = LABEL_META[result.label] || LABEL_META.neutral;
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <div className={`result-card ${meta.cls}`}>
      <div className="result-header">
        <span className="result-emoji">{meta.emoji}</span>
        <div>
          <div className="result-label">{result.label.toUpperCase()}</div>
          <div className="result-sub">{confidencePct}% confidence</div>
        </div>
      </div>

      <p className="result-text">“{result.text}”</p>

      <div className="confidence-bar">
        <div
          className="confidence-fill"
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {result.influential_words && result.influential_words.length > 0 && (
        <div className="keywords">
          <span className="keywords-label">Key signals:</span>
          {result.influential_words.map((w) => (
            <span key={w} className="keyword-chip">
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
