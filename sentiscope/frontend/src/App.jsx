/**
 * App
 * ---
 * Top-level layout: a hero header with a live service-health indicator, the
 * Analyzer panel, and the analytics Dashboard. A simple `refreshKey` counter
 * tells the dashboard to reload after each new analysis.
 */
import { useEffect, useState } from "react";
import Analyzer from "./components/Analyzer.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { getHealth } from "./api.js";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [health, setHealth] = useState({ ok: false, ml: false });

  useEffect(() => {
    let active = true;
    async function ping() {
      try {
        const h = await getHealth();
        if (active) setHealth({ ok: true, ml: h.mlServiceReachable });
      } catch {
        if (active) setHealth({ ok: false, ml: false });
      }
    }
    ping();
    const id = setInterval(ping, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const status = !health.ok
    ? { text: "Backend offline", cls: "down" }
    : !health.ml
    ? { text: "ML service offline", cls: "warn" }
    : { text: "All systems operational", cls: "up" };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="logo">◎</span>
            <h1>SentiScope</h1>
          </div>
          <p className="tagline">
            Real-time product-review sentiment analysis powered by a
            custom-trained machine learning model.
          </p>
          <div className={`status-pill ${status.cls}`}>
            <span className="status-dot" />
            {status.text}
          </div>
        </div>
      </header>

      <main className="layout">
        <Analyzer onAnalyzed={() => setRefreshKey((k) => k + 1)} />
        <Dashboard refreshKey={refreshKey} />
      </main>

      <footer className="footer">
        <span>
          React · Node/Express · Python (scikit-learn) · A full-stack + ML demo
        </span>
      </footer>
    </div>
  );
}
