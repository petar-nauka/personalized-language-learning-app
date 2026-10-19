"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PackDTO, TodayStatsDTO, UserSettingsDTO } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";

export default function TodayPage() {
  const [settings, setSettings] = useState<UserSettingsDTO | null>(null);
  const [stats, setStats] = useState<TodayStatsDTO | null>(null);
  const [packs, setPacks] = useState<PackDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingPack, setSwitchingPack] = useState<string | null>(null);
  const [cefrFilter, setCefrFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/today")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.settings) {
          setSettings(data.settings);
          document.documentElement.setAttribute("data-theme", data.settings.theme || "dark");
        }
        if (data.todayStats) setStats(data.todayStats);
        if (Array.isArray(data.packs)) setPacks(data.packs);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPack = async (pack: PackDTO) => {
    setSwitchingPack(pack.code);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active_pack_code: pack.code,
          current_stage: pack.stage,
          current_cefr: pack.cefr,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated.settings || updated);
      }
    } finally {
      setSwitchingPack(null);
    }
  };

  const activeMinutes = Math.floor((stats?.active_seconds ?? 0) / 60);
  const goalMinutes = settings?.daily_minutes_goal ?? 20;
  const pct = Math.min(100, Math.round(((stats?.active_seconds ?? 0) / (goalMinutes * 60)) * 100));
  const accuracy =
    stats && stats.total_answers > 0
      ? Math.round((stats.correct_answers / stats.total_answers) * 100)
      : 100;

  return (
    <>
      <main className="page-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="es-title" style={{ fontSize: "1.65rem" }}>
              Today&apos;s Progress
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
              Spanish from Zero to Fluency (A0 → A1 → A2 → B1 → B2)
            </p>
          </div>
          <Link href="/" className="primary-btn" style={{ minHeight: 40, padding: "8px 14px" }}>
            ⚡ Resume Feed
          </Link>
        </div>

        {/* Daily Goal & Stats Card */}
        <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
                DAILY FLOW GOAL
              </div>
              <div className="es-title" style={{ fontSize: "1.8rem", marginTop: 2 }}>
                {activeMinutes} <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/ {goalMinutes} min</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="badge badge-accent" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
                🔥 {stats?.streak_days ?? 0} day streak
              </span>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 10,
              borderRadius: 99,
              backgroundColor: "var(--surface-elevated)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                backgroundColor: pct >= 100 ? "var(--ok)" : "var(--accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              textAlign: "center",
            }}
          >
            <div className="panel-elevated" style={{ padding: "10px 6px" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{stats?.cards_completed ?? 0}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Cards</div>
            </div>
            <div className="panel-elevated" style={{ padding: "10px 6px" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{stats?.new_items_learned ?? 0}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>New Words</div>
            </div>
            <div className="panel-elevated" style={{ padding: "10px 6px" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{stats?.due_reviews_count ?? 0}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Due FSRS</div>
            </div>
            <div className="panel-elevated" style={{ padding: "10px 6px" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{accuracy}%</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Accuracy</div>
            </div>
          </div>
        </section>

        {/* Curriculum Roadmap (40 Packs: A0 -> B2) */}
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Curriculum Roadmap ({packs.length || 40} Packs • A0 → B2)
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              Filter by CEFR level or tap any pack below to switch your active feed.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {["ALL", "A0", "A1", "A2", "B1", "B2"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setCefrFilter(lvl)}
                className="secondary-btn"
                style={{
                  minHeight: 34,
                  padding: "4px 6px",
                  fontSize: "0.78rem",
                  borderColor: cefrFilter === lvl ? "var(--accent)" : "var(--border)",
                  color: cefrFilter === lvl ? "var(--accent)" : "var(--muted)",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="panel" style={{ color: "var(--muted)" }}>
              Loading curriculum roadmap...
            </div>
          ) : (
            packs
              .filter((p) => cefrFilter === "ALL" || p.cefr === cefrFilter)
              .map((pack) => {
              const isActive = settings?.active_pack_code === pack.code;
              const total = pack.total_items || 0;
              const seen = pack.seen_items || 0;
              const packPct = total > 0 ? Math.round((seen / total) * 100) : 0;

              return (
                <div
                  key={pack.code}
                  className="panel"
                  style={{
                    borderColor: isActive ? "var(--accent)" : "var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: "1.6rem" }}>{pack.icon}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                            {pack.seq_order}. {pack.title_en}
                          </span>
                          <span className="badge">{pack.cefr}</span>
                          {isActive && <span className="badge badge-accent">Active</span>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          🇧🇬 {pack.title_bg}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPack(pack)}
                      disabled={isActive || switchingPack === pack.code}
                      className={isActive ? "secondary-btn" : "primary-btn"}
                      style={{ minHeight: 34, padding: "4px 12px", fontSize: "0.78rem" }}
                    >
                      {isActive
                        ? "✓ Current"
                        : switchingPack === pack.code
                        ? "..."
                        : "Select"}
                    </button>
                  </div>

                  <div style={{ fontSize: "0.83rem", color: "var(--muted)" }}>
                    {pack.description_en}
                  </div>

                  {total > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 99,
                          backgroundColor: "var(--surface-elevated)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${packPct}%`,
                            height: "100%",
                            backgroundColor: packPct >= 75 ? "var(--ok)" : "var(--accent)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.76rem", color: "var(--muted)", fontWeight: 600 }}>
                        {seen}/{total} ({packPct}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>

      <BottomNav />
    </>
  );
}
