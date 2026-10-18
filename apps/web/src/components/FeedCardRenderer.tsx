"use client";

import React, { useState, useEffect } from "react";
import {
  FeedCardDTO,
  SoundRuleContent,
  VisualWordContent,
  PhraseSituationContent,
  MicroBuilderContent,
  DiglotWeaveContent,
  StoryXRayContent,
  AudioBlurContent,
  SayItContent,
  ShadowingContent,
  TrapChoiceContent,
  MultipleChoiceQuestion,
} from "@/lib/types";
import { AudioButton } from "./AudioButton";
import { XRayWordInfo } from "./XRaySheet";
import { playSpanishAudio } from "@/lib/audio";

interface FeedCardRendererProps {
  card: FeedCardDTO;
  isActive: boolean;
  bgHelperLevel: number;
  audioAutoplay: boolean;
  audioSlowDefault: boolean;
  muted: boolean;
  onAnswer: (card: FeedCardDTO, correct: boolean) => void;
  onMarkKnown: (card: FeedCardDTO) => void;
  onToggleSave: (card: FeedCardDTO) => void;
  onFlag: (card: FeedCardDTO) => void;
  onOpenXRay: (word: XRayWordInfo) => void;
  onNextCard: () => void;
}

const CARD_TYPE_LABELS: Record<string, string> = {
  sound_rule: "🔤 Sound & Reading",
  visual_word: "🖼️ Visual Word",
  phrase_situation: "💬 Real Situation",
  micro_builder: "🧩 Word Builder",
  diglot_weave: "🌉 Bridge Sentence",
  story_xray: "📖 X-Ray Story",
  audio_blur: "🎧 Ear Training",
  say_it: "🎙️ Say It Out Loud",
  shadowing: "🗣️ Rhythm Shadowing",
  trap_choice: "⚠️ Beginner Trap",
};

export function FeedCardRenderer({
  card,
  isActive,
  bgHelperLevel,
  audioAutoplay,
  audioSlowDefault,
  muted,
  onAnswer,
  onMarkKnown,
  onToggleSave,
  onFlag,
  onOpenXRay,
  onNextCard,
}: FeedCardRendererProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Micro-builder state
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [builderChecked, setBuilderChecked] = useState(false);
  const [builderCorrect, setBuilderCorrect] = useState(false);

  // Story translation toggle & Audio blur reveal
  const [showTranslation, setShowTranslation] = useState(false);
  const [blurRevealed, setBlurRevealed] = useState(false);

  // Say-it & Shadowing state
  const [sayItRevealed, setSayItRevealed] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeTimingIdx, setActiveTimingIdx] = useState<number>(-1);

  // Autoplay audio when card becomes active (if enabled and not muted)
  useEffect(() => {
    if (!isActive || muted || !audioAutoplay) return;
    const primaryEs = getPrimarySpanishText(card);
    if (!primaryEs) return;
    const timer = setTimeout(() => {
      playSpanishAudio({
        audioUrl: card.audio_url,
        fallbackText: primaryEs,
        rate: audioSlowDefault ? 0.75 : 1.0,
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [isActive, muted, audioAutoplay, audioSlowDefault, card]);

  const handleMCQSelect = (idx: number, q: MultipleChoiceQuestion) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    const isCorrect = idx === q.answer;
    if (card.card_type === "audio_blur") {
      setBlurRevealed(true);
    }
    onAnswer(card, isCorrect);
  };

  const renderMCQ = (q: MultipleChoiceQuestion) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--muted)" }}>
          {q.prompt}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {q.options.map((opt, idx) => {
            let extraClass = "";
            if (answered) {
              if (idx === q.answer) extraClass = "option-btn-correct";
              else if (idx === selectedOption) extraClass = "option-btn-wrong";
            }
            return (
              <button
                key={idx}
                type="button"
                className={`option-btn ${extraClass}`}
                onClick={() => handleMCQSelect(idx, q)}
              >
                <span>{opt}</span>
                {answered && idx === q.answer && <span>✓</span>}
                {answered && idx === selectedOption && idx !== q.answer && <span>✗</span>}
              </button>
            );
          })}
        </div>
        {answered && q.explain && (
          <div
            className="panel-elevated"
            style={{
              fontSize: "0.85rem",
              borderColor: selectedOption === q.answer ? "var(--ok)" : "var(--err)",
            }}
          >
            {q.explain}
          </div>
        )}
      </div>
    );
  };

  const renderPhotoBanner = (altText: string) => {
    if (!card.image_url) return null;
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 155,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-elevated)",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image_url}
          alt={altText}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading="lazy"
        />
        {card.image_source && (
          <span
            style={{
              position: "absolute",
              bottom: 6,
              right: 8,
              fontSize: "0.65rem",
              padding: "2px 6px",
              borderRadius: 6,
              backgroundColor: "var(--overlay)",
              color: "var(--muted)",
            }}
          >
            📷 {card.image_source}
          </span>
        )}
      </div>
    );
  };

  const renderCardBody = () => {
    switch (card.card_type) {
      case "sound_rule": {
        const c = card.content as SoundRuleContent;
        return (
          <>
            {renderPhotoBanner(c.rule_title)}
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  className="es-title"
                  style={{
                    fontSize: "2.2rem",
                    color: "var(--accent)",
                    padding: "4px 14px",
                    borderRadius: 12,
                    backgroundColor: "var(--accent-soft)",
                  }}
                >
                  {c.grapheme}
                </span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                    Sounds like: [{c.phonetic_en}]
                  </div>
                  {bgHelperLevel > 0 && c.phonetic_bg && (
                    <div style={{ fontSize: "0.85rem", color: "var(--accent)" }}>
                      🇧🇬 Като българско: „{c.phonetic_bg}“
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.02rem" }}>{c.rule_title}</div>
              <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{c.rule_summary}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {c.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="panel-elevated"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>{ex.es}</span>{" "}
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        [{ex.phonetic}]
                      </span>
                      <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>🇬🇧 {ex.en}</div>
                    </div>
                    <AudioButton audioUrl={ex.audio_url} text={ex.es} compact />
                  </div>
                ))}
              </div>
            </div>
            {renderMCQ(c.question)}
          </>
        );
      }

      case "visual_word": {
        const c = card.content as VisualWordContent;
        const isMasc = c.article === "el" || c.article === "los";
        const isFem = c.article === "la" || c.article === "las";

        return (
          <>
            {renderPhotoBanner(c.en)}
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {c.article && (
                      <span className={isMasc ? "gender-m" : isFem ? "gender-f" : "badge"}>
                        {c.article}
                      </span>
                    )}
                    <span className="es-title">{c.noun || c.es}</span>
                  </div>
                  <div style={{ fontSize: "0.86rem", color: "var(--muted)", marginTop: 2 }}>
                    [{c.phonetic}] • 🇬🇧 <strong>{c.en}</strong>
                    {bgHelperLevel >= 1 && c.bg ? ` • 🇧🇬 ${c.bg}` : ""}
                  </div>
                </div>
                <AudioButton audioUrl={card.audio_url} text={c.es} compact />
              </div>

              {c.cognate_or_memory_tip && (
                <div style={{ fontSize: "0.83rem", color: "var(--muted)" }}>
                  🔗 {c.cognate_or_memory_tip}
                </div>
              )}

              {bgHelperLevel >= 1 && c.bg_bridge && (
                <div style={{ fontSize: "0.83rem", color: "var(--accent)" }}>
                  💡 {c.bg_bridge}
                </div>
              )}

              {c.mini_sentence && (
                <div
                  className="panel-elevated"
                  style={{
                    marginTop: 2,
                    padding: "8px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                    {c.mini_sentence.tokens && c.mini_sentence.tokens.length > 0
                      ? c.mini_sentence.tokens.map((tok, i) => (
                          <span
                            key={i}
                            className="tappable-word"
                            onClick={() =>
                              onOpenXRay({
                                es: tok.es,
                                en: tok.en,
                                lemma: tok.lemma,
                                grammar: tok.grammar,
                                phonetic: tok.phonetic,
                              })
                            }
                          >
                            {tok.es}
                          </span>
                        ))
                      : c.mini_sentence.es}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    {c.mini_sentence.en} (tap any word for X-Ray)
                  </div>
                </div>
              )}
            </div>
            {renderMCQ(c.question)}
          </>
        );
      }

      case "phrase_situation": {
        const c = card.content as PhraseSituationContent;
        return (
          <>
            {renderPhotoBanner(c.situation_en)}
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 700 }}>
                📍 SITUATION: {c.situation_en}
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div className="es-title" style={{ fontSize: "1.45rem" }}>
                  {c.tokens && c.tokens.length > 0
                    ? c.tokens.map((tok, i) => (
                        <span
                          key={i}
                          className="tappable-word"
                          onClick={() =>
                            onOpenXRay({
                              es: tok.es,
                              en: tok.en,
                              lemma: tok.lemma,
                              grammar: tok.grammar,
                              phonetic: tok.phonetic,
                            })
                          }
                        >
                          {tok.es}
                        </span>
                      ))
                    : c.es}
                </div>
                <AudioButton audioUrl={card.audio_url} text={c.es} compact />
              </div>
              <div style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                [{c.phonetic}] • 🇬🇧 <strong>{c.en}</strong>
              </div>
              {bgHelperLevel >= 1 && c.bg_bridge && (
                <div style={{ fontSize: "0.83rem", color: "var(--accent)" }}>
                  💡 {c.bg_bridge}
                </div>
              )}
              {c.reply_preview && (
                <div className="panel-elevated" style={{ fontSize: "0.84rem" }}>
                  <div>
                    🗣️ Reply you&apos;ll hear: <strong>{c.reply_preview.waiter_es}</strong>
                  </div>
                  <div style={{ color: "var(--muted)" }}>{c.reply_preview.waiter_en}</div>
                </div>
              )}
            </div>
            {renderMCQ(c.question)}
          </>
        );
      }

      case "micro_builder": {
        const c = card.content as MicroBuilderContent;
        const builtWords = pickedIndices.map((idx) => c.tiles[idx]);

        const handlePickTile = (tileIdx: number) => {
          if (builderChecked) return;
          if (pickedIndices.includes(tileIdx)) {
            setPickedIndices(pickedIndices.filter((i) => i !== tileIdx));
          } else {
            setPickedIndices([...pickedIndices, tileIdx]);
          }
        };

        const handleCheckBuilder = () => {
          if (builderChecked || pickedIndices.length === 0) return;
          const normalize = (s: string) =>
            s
              .replace(/[¡!¿?.,]/g, "")
              .trim()
              .toLowerCase();
          const userStr = normalize(builtWords.join(" "));
          const targetStr = normalize(c.correct_sequence.join(" "));
          const isOk = userStr === targetStr;
          setBuilderChecked(true);
          setBuilderCorrect(isOk);
          setAnswered(true);
          onAnswer(card, isOk);
          playSpanishAudio({ audioUrl: card.audio_url, fallbackText: c.target_es, rate: 1.0 });
        };

        return (
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 700 }}>
              📍 {c.situation_en}
            </div>
            <div>
              <div style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                Build in Spanish:
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: 2 }}>
                “{c.prompt_en}”
              </div>
            </div>

            {/* Target slot box */}
            <div
              className="panel-elevated"
              style={{
                minHeight: 62,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                borderColor: builderChecked
                  ? builderCorrect
                    ? "var(--ok)"
                    : "var(--err)"
                  : "var(--border)",
              }}
            >
              {builtWords.length === 0 ? (
                <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                  Tap word tiles below in the right order...
                </span>
              ) : (
                builtWords.map((w, pos) => (
                  <button
                    key={pos}
                    type="button"
                    className="secondary-btn"
                    style={{
                      minHeight: 36,
                      padding: "4px 12px",
                      borderColor: "var(--accent)",
                    }}
                    onClick={() => handlePickTile(pickedIndices[pos])}
                  >
                    {w}
                  </button>
                ))
              )}
            </div>

            {/* Available tiles */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {c.tiles.map((tile, idx) => {
                const used = pickedIndices.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={used || builderChecked}
                    onClick={() => handlePickTile(idx)}
                    className="secondary-btn"
                    style={{
                      opacity: used ? 0.3 : 1,
                      minHeight: 40,
                      padding: "6px 14px",
                    }}
                  >
                    {tile}
                  </button>
                );
              })}
            </div>

            {!builderChecked ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setPickedIndices([])}
                  disabled={pickedIndices.length === 0}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ flex: 1 }}
                  onClick={handleCheckBuilder}
                  disabled={pickedIndices.length === 0}
                >
                  Check Sentence
                </button>
              </div>
            ) : (
              <div
                className="panel-elevated"
                style={{
                  borderColor: builderCorrect ? "var(--ok)" : "var(--err)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: builderCorrect ? "var(--ok)" : "var(--err)" }}>
                    {builderCorrect ? "✓ Perfect!" : `✗ Correct: ${c.target_es}`}
                  </strong>
                  <AudioButton audioUrl={card.audio_url} text={c.target_es} compact />
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                  [{c.phonetic}] — {c.explain}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "diglot_weave": {
        const c = card.content as DiglotWeaveContent;
        return (
          <>
            {renderPhotoBanner("Bridge sentence")}
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                Tap the highlighted Spanish word to inspect its X-Ray & audio:
              </div>
              <div className="es-story" style={{ fontSize: "1.28rem" }}>
                {c.segments.map((seg, idx) =>
                  seg.type === "es" ? (
                    <span
                      key={idx}
                      className="tappable-word"
                      style={{
                        color: "var(--accent)",
                        fontWeight: 700,
                        padding: "2px 6px",
                      }}
                      onClick={() => {
                        playSpanishAudio({
                          audioUrl: card.audio_url,
                          fallbackText: seg.text,
                          rate: 1.0,
                        });
                        onOpenXRay({
                          es: seg.text,
                          en: seg.en || "",
                          phonetic: seg.phonetic,
                          item_id: seg.item_id,
                          audio_url: card.audio_url,
                        });
                      }}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={idx}>{seg.text}</span>
                  )
                )}
              </div>
            </div>
            {renderMCQ(c.question)}
          </>
        );
      }

      case "story_xray": {
        const c = card.content as StoryXRayContent;
        return (
          <>
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div className="es-title" style={{ fontSize: "1.3rem" }}>
                    {c.title_es}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{c.title_en}</div>
                </div>
                <AudioButton audioUrl={card.audio_url} text={c.text_es} compact />
              </div>

              <div className="es-story" style={{ padding: "4px 0" }}>
                {c.tokens && c.tokens.length > 0
                  ? c.tokens.map((tok, i) => (
                      <span
                        key={i}
                        className="tappable-word"
                        onClick={() =>
                          onOpenXRay({
                            es: tok.w,
                            en: tok.en,
                            lemma: tok.lemma,
                            phonetic: tok.phonetic,
                          })
                        }
                      >
                        {tok.w}
                      </span>
                    ))
                  : c.text_es}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                  👆 Tap any word for instant X-Ray translation
                </span>
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ minHeight: 30, padding: "2px 10px", fontSize: "0.76rem" }}
                  onClick={() => setShowTranslation(!showTranslation)}
                >
                  {showTranslation ? "Hide English" : "Show English"}
                </button>
              </div>

              {showTranslation && (
                <div className="panel-elevated" style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                  🇬🇧 {c.translation_en}
                </div>
              )}

              {c.highlights && c.highlights.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {c.highlights.map((h, i) => (
                    <div key={i} style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
                      ✨ <strong>{h.phrase}</strong> ({h.en}) — {h.why}
                      {bgHelperLevel >= 1 && h.bg_bridge ? ` • 🇧🇬 ${h.bg_bridge}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {renderMCQ(c.question)}
          </>
        );
      }

      case "audio_blur": {
        const c = card.content as AudioBlurContent;
        return (
          <>
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 700 }}>
                🎧 {c.context_en}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <AudioButton audioUrl={card.audio_url} text={c.es} />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setBlurRevealed(true)}
                  style={{ fontSize: "0.8rem" }}
                >
                  {blurRevealed ? "👁️ Revealed" : "👁️ Reveal Text"}
                </button>
              </div>

              <div
                className="panel-elevated"
                onClick={() => setBlurRevealed(true)}
                style={{ cursor: "pointer", textAlign: "center", padding: "14px" }}
              >
                <div
                  className="es-title"
                  style={{
                    fontSize: "1.4rem",
                    filter: blurRevealed ? "none" : "blur(7px)",
                    transition: "filter 0.25s ease",
                    userSelect: blurRevealed ? "text" : "none",
                  }}
                >
                  {c.es}
                </div>
                {blurRevealed && (
                  <div style={{ fontSize: "0.86rem", color: "var(--muted)", marginTop: 6 }}>
                    [{c.phonetic}] — 🇬🇧 {c.en}
                  </div>
                )}
              </div>
            </div>
            {renderMCQ(c.question)}
          </>
        );
      }

      case "say_it": {
        const c = card.content as SayItContent;

        const handleSpeechInput = () => {
          if (typeof window === "undefined") return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRec) {
            setSayItRevealed(true);
            return;
          }
          const rec = new SpeechRec();
          rec.lang = "es-ES";
          rec.interimResults = false;
          setIsListening(true);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rec.onresult = (ev: any) => {
            const spoken = ev.results?.[0]?.[0]?.transcript || "";
            setTranscript(spoken);
            setSayItRevealed(true);
            setIsListening(false);
          };
          rec.onerror = () => {
            setIsListening(false);
            setSayItRevealed(true);
          };
          rec.onend = () => setIsListening(false);
          rec.start();
        };

        return (
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 700 }}>
              🎙️ SPEAKING SITUATION: {c.situation_en}
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
                How would you say in Spanish:
              </div>
              <div className="es-title" style={{ fontSize: "1.4rem", marginTop: 4 }}>
                “{c.prompt_en}”
              </div>
              {c.hint_en && (
                <div style={{ fontSize: "0.84rem", color: "var(--muted)", marginTop: 4 }}>
                  Hint: {c.hint_en}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="primary-btn"
                style={{ flex: 1 }}
                onClick={handleSpeechInput}
              >
                {isListening ? "🔴 Listening (es-ES)..." : "🎙️ Speak or Reveal"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setSayItRevealed(true);
                  playSpanishAudio({ audioUrl: card.audio_url, fallbackText: c.target_es });
                }}
              >
                👁️ Show Answer
              </button>
            </div>

            {transcript && (
              <div className="panel-elevated" style={{ fontSize: "0.88rem" }}>
                You said: <strong>“{transcript}”</strong>
              </div>
            )}

            {sayItRevealed && (
              <div className="panel-elevated" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="es-title" style={{ fontSize: "1.35rem", color: "var(--ok)" }}>
                      {c.target_es}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      [{c.phonetic}]
                    </div>
                  </div>
                  <AudioButton audioUrl={card.audio_url} text={c.target_es} compact />
                </div>
                {c.notes && (
                  <div style={{ fontSize: "0.83rem", color: "var(--muted)" }}>{c.notes}</div>
                )}

                {!answered && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ flex: 1, borderColor: "var(--err)", color: "var(--err)" }}
                      onClick={() => {
                        setAnswered(true);
                        onAnswer(card, false);
                      }}
                    >
                      ↻ Need practice
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ flex: 1, borderColor: "var(--ok)", color: "var(--ok)" }}
                      onClick={() => {
                        setAnswered(true);
                        onAnswer(card, true);
                      }}
                    >
                      ✓ Said it well
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case "shadowing": {
        const c = card.content as ShadowingContent;
        const words = c.target_words && c.target_words.length > 0 ? c.target_words : c.es.split(" ");

        const handlePlayShadowing = (rate: number) => {
          setActiveTimingIdx(0);
          playSpanishAudio({
            audioUrl: card.audio_url,
            fallbackText: c.es,
            rate,
            onWordBoundary: (timeMs) => {
              if (card.word_timings && card.word_timings.length > 0) {
                const idx = card.word_timings.findIndex(
                  (t) => timeMs >= t.start_ms && timeMs <= t.end_ms + 120
                );
                if (idx !== -1) setActiveTimingIdx(idx);
              }
            },
            onEnd: () => setActiveTimingIdx(-1),
          });
        };

        return (
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 700 }}>
              🗣️ SHADOWING: Repeat simultaneously with the speaker
            </div>

            <div
              className="panel-elevated"
              style={{
                padding: "18px 14px",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {words.map((w, idx) => (
                <span
                  key={idx}
                  className="es-title"
                  style={{
                    fontSize: "1.55rem",
                    padding: "2px 6px",
                    borderRadius: 8,
                    backgroundColor:
                      activeTimingIdx === idx ? "var(--accent-soft)" : "transparent",
                    color: activeTimingIdx === idx ? "var(--accent)" : "var(--fg)",
                    transition: "all 0.12s ease",
                  }}
                >
                  {w}
                </span>
              ))}
            </div>

            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.9rem" }}>
              [{c.phonetic}] — 🇬🇧 {c.en}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => handlePlayShadowing(0.75)}
              >
                🐢 Slow (0.75x)
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => handlePlayShadowing(1.0)}
              >
                🔊 Normal Rhythm (1.0x)
              </button>
            </div>

            {!answered && (
              <button
                type="button"
                className="secondary-btn"
                style={{ borderColor: "var(--ok)", color: "var(--ok)", marginTop: 4 }}
                onClick={() => {
                  setAnswered(true);
                  onAnswer(card, true);
                }}
              >
                ✓ I shadowed this out loud
              </button>
            )}
          </div>
        );
      }

      case "trap_choice": {
        const c = card.content as TrapChoiceContent;
        const q: MultipleChoiceQuestion = {
          prompt: c.prompt,
          options: c.options,
          answer: c.answer,
          explain: `${c.trap_title}: ${c.explain_en}${
            bgHelperLevel >= 1 && c.bg_bridge ? ` (🇧🇬 ${c.bg_bridge})` : ""
          }`,
        };
        return (
          <>
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 700 }}>
                ⚠️ SPOT THE TRAP • {c.situation_en}
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{c.trap_title}</div>
            </div>
            {renderMCQ(q)}
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <section className="feed-card">
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="badge">{CARD_TYPE_LABELS[card.card_type] || card.card_type}</span>
          <span className="badge">{card.cefr}</span>
          {card.is_review && <span className="badge badge-accent">🔄 Review</span>}
        </div>
        {answered && (
          <button
            type="button"
            onClick={onNextCard}
            className="badge badge-accent"
            style={{ cursor: "pointer" }}
          >
            Next ↓
          </button>
        )}
      </div>

      {/* Main Scrollable Card Body */}
      <div className="feed-card-inner">{renderCardBody()}</div>

      {/* Bottom Quick Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--border)",
          marginTop: 6,
        }}
      >
        <button
          type="button"
          className="secondary-btn"
          style={{
            minHeight: 34,
            padding: "4px 10px",
            fontSize: "0.78rem",
            color: "var(--ok)",
          }}
          onClick={() => onMarkKnown(card)}
          title="Already know this word/phrase? Hide it from beginner drills"
        >
          ✓ I know this
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="secondary-btn"
            style={{
              minHeight: 34,
              padding: "4px 10px",
              fontSize: "0.78rem",
              borderColor: card.saved ? "var(--accent)" : "var(--border)",
              color: card.saved ? "var(--accent)" : "var(--muted)",
            }}
            onClick={() => onToggleSave(card)}
          >
            {card.saved ? "★ Saved" : "☆ Save"}
          </button>
          <button
            type="button"
            className="secondary-btn"
            style={{
              minHeight: 34,
              padding: "4px 10px",
              fontSize: "0.78rem",
              color: "var(--muted)",
            }}
            onClick={() => onFlag(card)}
            title="Report an issue with this card"
          >
            ⚑
          </button>
        </div>
      </div>
    </section>
  );
}

function getPrimarySpanishText(card: FeedCardDTO): string {
  const c = card.content || {};
  if (typeof c.es === "string") return c.es;
  if (typeof c.target_es === "string") return c.target_es;
  if (typeof c.text_es === "string") return c.text_es;
  if (Array.isArray(c.examples) && c.examples[0]?.es) return c.examples[0].es;
  return "";
}
