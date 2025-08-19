"use client";

import { useMemo, useState } from "react";

const THEMES = [
  "light",
  "dark",
  "dracula",
  "nord",
  "radical",
  "github",
  "transparent",
  "tokyonight",
  "gruvbox",
  "monokai",
  "rose-pine",
  "catppuccin-mocha",
  "catppuccin-latte",
  "night-owl",
  "ayu-dark"
];

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState("github");
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cardUrl = useMemo(() => {
    if (!username) return "";
    const safe = username.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39);
    const params = new URLSearchParams({ username: safe, theme });
    return `/api/card?${params.toString()}`;
  }, [username, theme]);

  async function handleFetch() {
    if (!username) return;
    setError(null);
    setLoading(true);
    try {
      const safe = username.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 39);
      const params = new URLSearchParams({ username: safe });
      const res = await fetch(`/api/stats?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }

  const markdown = useMemo(() => {
    if (!username) return "";
    const host = typeof window !== "undefined" ? window.location.origin : "";
    return `![GitHub Language Stats](${host}${cardUrl})`;
  }, [username, cardUrl]);

  async function copy() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ margin: 0, fontSize: 30 }}>GitHub Language Stats Card</h1>
      <p style={{ color: "#444", marginTop: 6 }}>Generate a concise, themeable SVG card showing your most used languages and lines of code.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 20 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>GitHub username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="octocat" style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 }}>
            {THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <div>
          <button onClick={handleFetch} disabled={!username || loading} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" }}>
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>{error}</div>
      )}

      {username && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Preview</h2>
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" }}>
            {cardUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cardUrl} alt="GitHub stats card" style={{ maxWidth: "100%", display: "block", margin: "0 auto" }} />
            ) : null}
          </div>

          <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>Markdown</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <textarea readOnly value={markdown} rows={2} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }} />
            <button onClick={copy} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: copied ? "#16a34a" : "#111", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      )}

      {stats && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Details</h2>
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" }}>
            <div style={{ marginBottom: 8 }}><strong>Estimated LOC:</strong> {Intl.NumberFormat().format(stats.totalEstimatedLines)}</div>
            {typeof stats.totalCommittedLinesAll === "number" && (
              <div style={{ marginBottom: 8 }}><strong>Committed LOC (all repos, additions):</strong> {Intl.NumberFormat().format(stats.totalCommittedLinesAll)}</div>
            )}
            {typeof stats.totalCommittedLinesUser === "number" && (
              <div style={{ marginBottom: 8 }}><strong>Committed LOC (your additions):</strong> {Intl.NumberFormat().format(stats.totalCommittedLinesUser)}</div>
            )}
            {typeof stats.repoCount === "number" && (
              <div style={{ marginBottom: 8 }}><strong>Repos counted:</strong> {stats.repoCount}</div>
            )}
            <div style={{ marginTop: 12 }}>
              <strong>Languages</strong>
              <ul>
                {stats.languages.slice(0, 15).map((l: any) => (
                  <li key={l.name}>{l.name}: {Intl.NumberFormat().format(l.estimatedLines)} LOC ({l.percent.toFixed(1)}%)</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <footer style={{ marginTop: 40, color: "#666" }}>
        Deployed on Vercel. This card updates automatically on request via the API.
      </footer>
    </main>
  );
}
