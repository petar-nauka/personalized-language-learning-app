"use client";

import React, { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("petar");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid username or password");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="page-shell"
      style={{ justifyContent: "center", minHeight: "100dvh", paddingBottom: 24 }}
    >
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.4rem" }}>🇪🇸</div>
          <h1 className="es-title" style={{ marginTop: 6 }}>
            Ezik — Spanish from Zero
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 4 }}>
            Visual Reels feed • Neural Spanish audio • FSRS v5 memory
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.86rem" }}>
            <span style={{ color: "var(--muted)" }}>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.86rem" }}>
            <span style={{ color: "var(--muted)" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
              }}
            />
          </label>

          {error && (
            <div
              className="panel-elevated"
              style={{ borderColor: "var(--err)", color: "var(--err)", fontSize: "0.86rem" }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Start Spanish Flow →"}
          </button>
        </form>
      </div>
    </main>
  );
}
