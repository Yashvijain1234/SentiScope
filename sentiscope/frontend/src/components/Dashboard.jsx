/**
 * Dashboard
 * ---------
 * Aggregate view of everything analyzed so far: a sentiment breakdown pie
 * chart, headline stats, and a scrollable history list. Refreshes whenever
 * `refreshKey` changes (i.e. after a new analysis).
 */
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getStats, getHistory, clearHistory } from "../api.js";

const COLORS = { positive: "#22c55e", negative: "#ef4444", neutral: "#94a3b8" };

export default function Dashboard({ refreshKey }) {
  const [stats, setStats] = useState({ total: 0, byLabel: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([getStats(), getHistory(30)]);
      setStats(s);
      setHistory(h.history);
    } catch {
      /* surfaced elsewhere; keep dashboard resilient */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  const pieData = stats.byLabel.map((row) => ({
    name: row.label,
    value: row.count,
  }));

  const positive = stats.byLabel.find((r) => r.label === "positive")?.count || 0;
  const negative = stats.byLabel.find((r) => r.label === "negative")?.count || 0;
  const neutral = stats.byLabel.find((r) => r.label === "neutral")?.count || 0;
  const posPct = stats.total ? Math.round((positive / stats.total) * 100) : 0;

  async function handleClear() {
    if (!confirm("Clear all analysis history?")) return;
    await clearHistory();
    load();
  }

  return (
    <section className="card dashboard">
      <div className="dashboard-head">
        <h2>Analytics Dashboard</h2>
        {stats.total > 0 && (
          <button className="ghost-btn" onClick={handleClear}>
            Clear history
          </button>
        )}
      </div>

      {stats.total === 0 ? (
        <p className="empty-state">
          No analyses yet. Analyze a review to see insights here.
        </p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat-box">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Total analyzed</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: COLORS.positive }}>
                {positive}
              </div>
              <div className="stat-label">Positive</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: COLORS.negative }}>
                {negative}
              </div>
              <div className="stat-label">Negative</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: COLORS.neutral }}>
                {neutral}
              </div>
              <div className="stat-label">Neutral</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{posPct}%</div>
              <div className="stat-label">Positive rate</div>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h3 className="history-title">Recent analyses</h3>
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id} className={`history-item ${item.label}`}>
                <span className={`dot ${item.label}`} />
                <span className="history-text">{item.text}</span>
                <span className="history-conf">
                  {Math.round(item.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
