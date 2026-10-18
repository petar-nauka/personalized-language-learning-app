"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ItemDTO } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { AudioButton } from "@/components/AudioButton";

type FilterMode = "all" | "learning" | "due" | "mastered";

export default function WordsPage() {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/items?filter=${filter}&q=${encodeURIComponent(query)}`
      );
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadItems]);

  const handleItemAction = async (id: string, action: "know" | "review_now") => {
    const res = await fetch(`/api/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      loadItems();
    }
  };

  return (
    <>
      <main className="page-shell">
        <div>
          <h1 className="es-title" style={{ fontSize: "1.65rem" }}>
            My Words & Phrases
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
            Inspect strength (0–5), play audio, or mark words you already know.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Spanish, English, or Bulgarian..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--border)",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {(["all", "learning", "due", "mastered"] as FilterMode[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="secondary-btn"
                style={{
                  minHeight: 34,
                  padding: "4px 8px",
                  fontSize: "0.78rem",
                  textTransform: "capitalize",
                  borderColor: filter === f ? "var(--accent)" : "var(--border)",
                  color: filter === f ? "var(--accent)" : "var(--muted)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="panel" style={{ color: "var(--muted)" }}>
            Loading vocabulary...
          </div>
        ) : items.length === 0 ? (
          <div className="panel" style={{ color: "var(--muted)", textAlign: "center" }}>
            No words match this filter yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => {
              const isMasc = item.article === "el" || item.article === "los";
              const isFem = item.article === "la" || item.article === "las";
              const strength = item.strength ?? 0;

              return (
                <div
                  key={item.id}
                  className="panel"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.en_gloss}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 10,
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "1px solid var(--border)",
                        }}
                        loading="lazy"
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {item.article && (
                          <span className={isMasc ? "gender-m" : isFem ? "gender-f" : "badge"}>
                            {item.article}
                          </span>
                        )}
                        <span className="es-title" style={{ fontSize: "1.2rem" }}>
                          {item.text}
                        </span>
                        {item.pack_code && (
                          <span className="badge" style={{ fontSize: "0.68rem" }}>
                            {item.pack_code.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {item.phonetic_hint && (
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          [{item.phonetic_hint}]
                        </div>
                      )}

                      <div style={{ fontSize: "0.9rem", marginTop: 2 }}>
                        🇬🇧 <strong>{item.en_gloss}</strong> • 🇧🇬 {item.bg_gloss}
                      </div>
                    </div>

                    <AudioButton audioUrl={item.audio_url} text={item.text} compact />
                  </div>

                  {/* Strength 0-5 bar & Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 8,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginRight: 4 }}>
                        Strength:
                      </span>
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <span
                          key={bar}
                          style={{
                            width: 12,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor:
                              strength >= bar
                                ? strength >= 4
                                  ? "var(--ok)"
                                  : "var(--accent)"
                                : "var(--surface-elevated)",
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      {item.mastered ? (
                        <button
                          type="button"
                          onClick={() => handleItemAction(item.id, "review_now")}
                          className="secondary-btn"
                          style={{ minHeight: 30, padding: "2px 10px", fontSize: "0.76rem" }}
                        >
                          ↻ Practice again
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleItemAction(item.id, "know")}
                          className="secondary-btn"
                          style={{
                            minHeight: 30,
                            padding: "2px 10px",
                            fontSize: "0.76rem",
                            color: "var(--ok)",
                            borderColor: "var(--ok)",
                          }}
                        >
                          ✓ I know this
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </>
  );
}
