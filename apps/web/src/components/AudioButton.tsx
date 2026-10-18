"use client";

import React, { useState } from "react";
import { playSpanishAudio } from "@/lib/audio";

interface AudioButtonProps {
  audioUrl?: string | null;
  text: string;
  compact?: boolean;
}

export function AudioButton({ audioUrl, text, compact = false }: AudioButtonProps) {
  const [playingMode, setPlayingMode] = useState<"normal" | "slow" | null>(null);

  const handlePlay = (rate: number, mode: "normal" | "slow", e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingMode(mode);
    playSpanishAudio({
      audioUrl,
      fallbackText: text,
      rate,
      onEnd: () => setPlayingMode(null),
    });
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: compact ? 6 : 8 }}>
      <button
        type="button"
        onClick={(e) => handlePlay(1.0, "normal", e)}
        className="secondary-btn"
        style={{
          minHeight: compact ? 34 : 40,
          padding: compact ? "4px 10px" : "6px 12px",
          borderColor: playingMode === "normal" ? "var(--accent)" : "var(--border)",
          color: playingMode === "normal" ? "var(--accent)" : "var(--fg)",
        }}
        title="Play normal speed (1.0x)"
      >
        <span aria-hidden="true">🔊</span>
        <span>{compact ? "1x" : "Listen"}</span>
      </button>
      <button
        type="button"
        onClick={(e) => handlePlay(0.75, "slow", e)}
        className="secondary-btn"
        style={{
          minHeight: compact ? 34 : 40,
          padding: compact ? "4px 10px" : "6px 12px",
          borderColor: playingMode === "slow" ? "var(--accent)" : "var(--border)",
          color: playingMode === "slow" ? "var(--accent)" : "var(--fg)",
        }}
        title="Play slow speed (0.75x)"
      >
        <span aria-hidden="true">🐢</span>
        <span>0.75x</span>
      </button>
    </div>
  );
}
