"use client";

import React from "react";
import Link from "next/link";

interface TopProgressBarProps {
  activeSeconds: number;
  dailyGoalMinutes: number;
  activePackCode: string;
  streakDays: number;
  muted: boolean;
  onToggleMute: () => void;
}

export function TopProgressBar({
  activeSeconds,
  dailyGoalMinutes,
  activePackCode,
  streakDays,
  muted,
  onToggleMute,
}: TopProgressBarProps) {
  const activeMinutes = Math.floor(activeSeconds / 60);
  const progressPct = Math.min(100, Math.round((activeSeconds / (dailyGoalMinutes * 60)) * 100));

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          padding: "10px 16px",
          backgroundColor: "var(--overlay)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          pointerEvents: "auto",
        }}
      >
        <Link href="/today" className="badge badge-accent" title="Switch pack or view progress">
          <span>🇪🇸</span>
          <span>{activePackCode.toUpperCase()}</span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.74rem",
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            <span>
              Daily Flow: {activeMinutes} / {dailyGoalMinutes} min
            </span>
            <span>🔥 {streakDays}d</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 6,
              borderRadius: 99,
              backgroundColor: "var(--surface-elevated)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                backgroundColor: progressPct >= 100 ? "var(--ok)" : "var(--accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="secondary-btn"
          style={{ minHeight: 34, padding: "4px 10px", fontSize: "0.8rem" }}
          title={muted ? "Unmute audio cards" : "Quiet mode (no audio/mic cards)"}
        >
          {muted ? "🔇 Quiet" : "🔊 Audio"}
        </button>
      </div>
    </header>
  );
}
