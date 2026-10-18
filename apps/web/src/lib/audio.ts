// Client-side Spanish audio player supporting 1.0x and 0.75x (turtle slow mode),
// with automatic fallback to Web Speech API (es-ES) when an MP3 file is not available.

let activeAudio: HTMLAudioElement | null = null;

export interface PlayAudioOptions {
  audioUrl?: string | null;
  fallbackText: string;
  lang?: string;
  rate?: number; // 1.0 for normal, 0.75 for slow
  onWordBoundary?: (timeMs: number) => void;
  onEnd?: () => void;
}

export function stopActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function playSpanishAudio(opts: PlayAudioOptions): void {
  if (typeof window === "undefined") return;
  stopActiveAudio();

  const rate = opts.rate ?? 1.0;

  if (opts.audioUrl) {
    const audio = new Audio(opts.audioUrl);
    audio.playbackRate = rate;
    activeAudio = audio;

    if (opts.onWordBoundary) {
      audio.addEventListener("timeupdate", () => {
        opts.onWordBoundary?.(audio.currentTime * 1000);
      });
    }

    audio.addEventListener("ended", () => {
      activeAudio = null;
      opts.onEnd?.();
    });

    audio.addEventListener("error", () => {
      activeAudio = null;
      speakWithBrowserTTS(opts.fallbackText, opts.lang || "es-ES", rate, opts.onEnd);
    });

    audio.play().catch(() => {
      speakWithBrowserTTS(opts.fallbackText, opts.lang || "es-ES", rate, opts.onEnd);
    });
    return;
  }

  speakWithBrowserTTS(opts.fallbackText, opts.lang || "es-ES", rate, opts.onEnd);
}

function speakWithBrowserTTS(text: string, lang: string, rate: number, onEnd?: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  const cleanText = text.replace(/^[—–-]\s*/, "").trim();
  if (!cleanText) {
    onEnd?.();
    return;
  }
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = lang;
  utter.rate = rate < 0.9 ? 0.72 : 0.95;

  const voices = window.speechSynthesis.getVoices();
  const esVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith("es-es")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("es"));
  if (esVoice) {
    utter.voice = esVoice;
  }
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}
