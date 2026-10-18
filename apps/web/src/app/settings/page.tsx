"use client";

import React, { useEffect, useState } from "react";
import { UserSettingsDTO } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.settings) {
          setSettings(data.settings);
          document.documentElement.setAttribute("data-theme", data.settings.theme || "dark");
        }
      });
  }, []);

  const updateSetting = async (patch: Partial<UserSettingsDTO>) => {
    if (!settings) return;
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    if (patch.theme) {
      document.documentElement.setAttribute("data-theme", patch.theme);
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated.settings || updated);
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 1600);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      <main className="page-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="es-title" style={{ fontSize: "1.65rem" }}>
              Settings
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
              Customize your daily Spanish Reels flow, audio, and Bulgarian bridge hints.
            </p>
          </div>
          {savedBanner && <span className="badge badge-accent">✓ Saved</span>}
        </div>

        {!settings ? (
          <div className="panel" style={{ color: "var(--muted)" }}>
            Loading settings...
          </div>
        ) : (
          <>
            {/* Daily Goal */}
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>⏱️ Daily Flow Goal (minutes/day)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[15, 20, 25, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => updateSetting({ daily_minutes_goal: mins })}
                    className="secondary-btn"
                    style={{
                      borderColor:
                        settings.daily_minutes_goal === mins ? "var(--accent)" : "var(--border)",
                      color: settings.daily_minutes_goal === mins ? "var(--accent)" : "var(--fg)",
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </section>

            {/* Audio & Speaking */}
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>🔊 Audio & Pronunciation</div>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>Autoplay Spanish audio</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    Play pronunciation automatically when snapping to a new card
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audio_autoplay}
                  onChange={(e) => updateSetting({ audio_autoplay: e.target.checked })}
                  style={{ width: 20, height: 20 }}
                />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>
                    🐢 Default to Slow Speed (0.75x)
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    Use slower articulation on autoplay for clearer syllables
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audio_slow_default}
                  onChange={(e) => updateSetting({ audio_slow_default: e.target.checked })}
                  style={{ width: 20, height: 20 }}
                />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>
                    🔇 Quiet Mode (No Audio / No Mic)
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    Temporarily hides listening & speaking cards when in public
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.muted}
                  onChange={(e) => updateSetting({ muted: e.target.checked })}
                  style={{ width: 20, height: 20 }}
                />
              </label>
            </section>

            {/* Bulgarian Bridge Level */}
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>🇧🇬 Bulgarian Helper Bridge (`bg_bridge`)</div>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                Primary explanations use English cognates, while Bulgarian notes highlight 1:1 phonetic and grammar shortcuts.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { level: 2, label: "Level 2: Full (BG glosses + phonetic/grammar bridges)" },
                  { level: 1, label: "Level 1: Bridges only (Key BG grammar shortcuts)" },
                  { level: 0, label: "Level 0: Off (100% English + Spanish only)" },
                ].map((opt) => (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => updateSetting({ bg_helper_level: opt.level })}
                    className="option-btn"
                    style={{
                      borderColor:
                        settings.bg_helper_level === opt.level ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    <span>{opt.label}</span>
                    {settings.bg_helper_level === opt.level && <span>✓</span>}
                  </button>
                ))}
              </div>
            </section>

            {/* Theme */}
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>🎨 Theme</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateSetting({ theme: t })}
                    className="secondary-btn"
                    style={{
                      textTransform: "capitalize",
                      borderColor: settings.theme === t ? "var(--accent)" : "var(--border)",
                      color: settings.theme === t ? "var(--accent)" : "var(--fg)",
                    }}
                  >
                    {t === "dark" ? "🌙 Warm Obsidian (Dark)" : "☀️ Warm Ivory (Light)"}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={handleLogout}
              disabled={saving}
              className="secondary-btn"
              style={{ borderColor: "var(--err)", color: "var(--err)", marginTop: 4 }}
            >
              Sign Out
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </>
  );
}
