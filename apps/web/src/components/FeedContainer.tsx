"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FeedCardDTO, UserSettingsDTO, TodayStatsDTO } from "@/lib/types";
import { TopProgressBar } from "./TopProgressBar";
import { BottomNav } from "./BottomNav";
import { FeedCardRenderer } from "./FeedCardRenderer";
import { XRaySheet, XRayWordInfo } from "./XRaySheet";
import { stopActiveAudio } from "@/lib/audio";

export function FeedContainer() {
  const [cards, setCards] = useState<FeedCardDTO[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settings, setSettings] = useState<UserSettingsDTO | null>(null);
  const [stats, setStats] = useState<TodayStatsDTO | null>(null);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [xrayWord, setXrayWord] = useState<XRayWordInfo | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const unsyncedSecondsRef = useRef<number>(0);
  const recentWrongRef = useRef<string[]>([]);
  const seenCardIdsRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const fetchBatch = useCallback(
    async (isInitial = false, mutedOverride?: boolean) => {
      if (!isInitial && fetchingMore) return;
      if (!isInitial) setFetchingMore(true);

      try {
        const excludeIds = Array.from(seenCardIdsRef.current).slice(-45).join(",");
        const recentWrong = recentWrongRef.current.slice(-5).join(",");
        const mutedParam = mutedOverride !== undefined ? `&muted=${mutedOverride ? "1" : "0"}` : "";
        const res = await fetch(
          `/api/feed?limit=10&exclude=${encodeURIComponent(excludeIds)}&recent_wrong=${encodeURIComponent(recentWrong)}${mutedParam}`
        );
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          document.documentElement.setAttribute("data-theme", data.settings.theme || "dark");
        }
        if (Array.isArray(data.cards)) {
          data.cards.forEach((c: FeedCardDTO) => seenCardIdsRef.current.add(c.id));
          setCards((prev) => (isInitial ? data.cards : [...prev, ...data.cards]));
        }
      } catch (err) {
        console.error("Failed to fetch feed:", err);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [fetchingMore]
  );

  // Initial load of feed + today's stats
  useEffect(() => {
    fetchBatch(true);
    fetch("/api/today")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const st = d?.todayStats || d?.stats;
        if (st) {
          setStats(st);
          setActiveSeconds(st.active_seconds || 0);
        }
      })
      .catch(() => {});
  }, [fetchBatch]);

  // Active study timer (increments every 1s while document is visible, syncs every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setActiveSeconds((s) => s + 1);
      unsyncedSecondsRef.current += 1;

      if (unsyncedSecondsRef.current >= 30) {
        const delta = unsyncedSecondsRef.current;
        unsyncedSecondsRef.current = 0;
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: null,
            activeSecondsDelta: delta,
          }),
        }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preload next 3 cards' images & audio, and fetch next batch at index >= cards.length - 3
  useEffect(() => {
    if (cards.length > 0 && activeIndex >= cards.length - 3 && !fetchingMore) {
      fetchBatch(false);
    }

    const upcoming = cards.slice(activeIndex + 1, activeIndex + 4);
    upcoming.forEach((c) => {
      if (c.image_url) {
        const img = new Image();
        img.src = c.image_url;
      }
      if (c.audio_url) {
        const aud = new Audio();
        aud.preload = "auto";
        aud.src = c.audio_url;
      }
    });
  }, [activeIndex, cards, fetchingMore, fetchBatch]);

  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const cardHeight = el.clientHeight || window.innerHeight;
    const idx = Math.round(el.scrollTop / cardHeight);
    if (idx !== activeIndex && idx >= 0 && idx < cards.length) {
      stopActiveAudio();
      setActiveIndex(idx);
    }
  };

  const scrollToNextCard = () => {
    const el = viewportRef.current;
    if (!el) return;
    const nextIdx = Math.min(cards.length - 1, activeIndex + 1);
    el.scrollTo({
      top: nextIdx * el.clientHeight,
      behavior: "smooth",
    });
  };

  const handleAnswer = async (card: FeedCardDTO, correct: boolean) => {
    const delta = unsyncedSecondsRef.current;
    unsyncedSecondsRef.current = 0;

    if (!correct && card.target_item_id) {
      recentWrongRef.current.push(card.target_item_id);
    }

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        itemId: card.target_item_id,
        eventType: correct ? "answer_correct" : "answer_wrong",
        activeSecondsDelta: delta,
      }),
    }).catch(() => {});
  };

  const handleMarkKnown = async (card: FeedCardDTO) => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        itemId: card.target_item_id,
        eventType: "know",
      }),
    }).catch(() => {});
    showToast("✓ Marked as known! Moving to next card.");
    scrollToNextCard();
  };

  const handleMarkWordKnown = async (word: XRayWordInfo) => {
    if (word.item_id) {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: word.item_id,
          eventType: "know",
        }),
      }).catch(() => {});
    }
    showToast(`✓ Marked "${word.es}" as known!`);
  };

  const handleToggleSave = async (card: FeedCardDTO) => {
    const nextSaved = !card.saved;
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, saved: nextSaved } : c))
    );
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        itemId: card.target_item_id,
        eventType: nextSaved ? "save" : "unsave",
      }),
    }).catch(() => {});
    showToast(nextSaved ? "★ Saved to collection" : "Removed from saved");
  };

  const handleFlag = async (card: FeedCardDTO) => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        itemId: card.target_item_id,
        eventType: "flag",
      }),
    }).catch(() => {});
    showToast("⚑ Card flagged for review. Skipping...");
    scrollToNextCard();
  };

  const handleToggleMute = async () => {
    if (!settings) return;
    const nextMuted = !settings.muted;
    setSettings({ ...settings, muted: nextMuted });
    stopActiveAudio();
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ muted: nextMuted }),
    }).catch(() => {});
    showToast(
      nextMuted
        ? "🔇 Quiet mode ON (audio/speaking cards hidden)"
        : "🔊 Audio mode ON"
    );
  };

  return (
    <>
      <TopProgressBar
        activeSeconds={activeSeconds}
        dailyGoalMinutes={settings?.daily_minutes_goal ?? 20}
        activePackCode={settings?.active_pack_code ?? "es_01"}
        streakDays={stats?.streak_days ?? 0}
        muted={settings?.muted ?? false}
        onToggleMute={handleToggleMute}
      />

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            backgroundColor: "var(--surface-elevated)",
            border: "1px solid var(--accent)",
            color: "var(--fg)",
            padding: "8px 16px",
            borderRadius: 999,
            fontSize: "0.84rem",
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <main
        ref={viewportRef}
        onScroll={handleScroll}
        className="feed-viewport"
      >
        {loading ? (
          <div className="feed-card" style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "var(--muted)", fontSize: "1rem" }}>
              Mixing your Spanish Reels feed...
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="feed-card" style={{ alignItems: "center", justifyContent: "center" }}>
            <div className="panel" style={{ textAlign: "center" }}>
              <div className="es-title">¡Todo listo!</div>
              <p style={{ color: "var(--muted)", marginTop: 8 }}>
                No cards available right now. Try switching packs in Today.
              </p>
            </div>
          </div>
        ) : (
          cards.map((card, idx) => (
            <FeedCardRenderer
              key={`${card.id}-${idx}`}
              card={card}
              isActive={idx === activeIndex}
              bgHelperLevel={settings?.bg_helper_level ?? 2}
              audioAutoplay={settings?.audio_autoplay ?? true}
              audioSlowDefault={settings?.audio_slow_default ?? false}
              muted={settings?.muted ?? false}
              onAnswer={handleAnswer}
              onMarkKnown={handleMarkKnown}
              onToggleSave={handleToggleSave}
              onFlag={handleFlag}
              onOpenXRay={(w) => setXrayWord(w)}
              onNextCard={scrollToNextCard}
            />
          ))
        )}
      </main>

      <XRaySheet
        word={xrayWord}
        onClose={() => setXrayWord(null)}
        onMarkKnown={handleMarkWordKnown}
      />

      <BottomNav />
    </>
  );
}
