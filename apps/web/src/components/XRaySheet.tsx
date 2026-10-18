"use client";

import React, { useEffect } from "react";
import { AudioButton } from "./AudioButton";

export interface XRayWordInfo {
  es: string;
  en: string;
  bg?: string | null;
  lemma?: string | null;
  article?: "el" | "la" | "los" | "las" | null;
  phonetic?: string | null;
  grammar?: string | null;
  bg_bridge?: string | null;
  audio_url?: string | null;
  item_id?: string | null;
}

interface XRaySheetProps {
  word: XRayWordInfo | null;
  onClose: () => void;
  onMarkKnown?: (word: XRayWordInfo) => void;
}

export function XRaySheet({ word, onClose, onMarkKnown }: XRaySheetProps) {
  useEffect(() => {
    if (!word) return;
    window.history.pushState({ xrayOpen: true }, "");
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [word, onClose]);

  if (!word) return null;

  const isMasc = word.article === "el" || word.article === "los";
  const isFem = word.article === "la" || word.article === "las";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--overlay)",
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "18px 20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 4,
            borderRadius: 99,
            backgroundColor: "var(--border)",
            margin: "0 auto 4px",
          }}
        />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {word.article && (
                <span className={isMasc ? "gender-m" : isFem ? "gender-f" : "badge"}>
                  {word.article}
                </span>
              )}
              <span className="es-title" style={{ fontSize: "1.6rem" }}>
                {word.es}
              </span>
            </div>
            {word.phonetic && (
              <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 2 }}>
                [{word.phonetic}]
              </div>
            )}
          </div>
          <AudioButton audioUrl={word.audio_url} text={word.es} compact />
        </div>

        <div className="panel-elevated" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>
            🇬🇧 {word.en}
          </div>
          {word.bg && (
            <div style={{ fontSize: "0.95rem", color: "var(--muted)" }}>
              🇧🇬 {word.bg}
            </div>
          )}
          {word.lemma && word.lemma !== word.es && (
            <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
              Base form (lemma): <strong>{word.lemma}</strong>
            </div>
          )}
          {word.grammar && (
            <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
              Grammar: {word.grammar}
            </div>
          )}
          {word.bg_bridge && (
            <div
              style={{
                marginTop: 4,
                paddingTop: 6,
                borderTop: "1px solid var(--border)",
                fontSize: "0.86rem",
                color: "var(--accent)",
              }}
            >
              💡 BG Bridge: {word.bg_bridge}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {onMarkKnown && (
            <button
              type="button"
              className="secondary-btn"
              style={{ flex: 1, borderColor: "var(--ok)", color: "var(--ok)" }}
              onClick={() => {
                onMarkKnown(word);
                onClose();
              }}
            >
              ✓ I already know this
            </button>
          )}
          <button
            type="button"
            className="primary-btn"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
