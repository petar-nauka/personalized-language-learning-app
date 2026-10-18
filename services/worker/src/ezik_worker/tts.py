from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any
import edge_tts

DEFAULT_ES_VOICE_F = "es-ES-ElviraNeural"
DEFAULT_ES_VOICE_M = "es-ES-AlvaroNeural"


async def synthesize_spanish_mp3(
    text: str,
    out_path: Path,
    voice: str = DEFAULT_ES_VOICE_F,
) -> list[dict[str, Any]]:
    """Generate an MP3 file for Spanish text and return word-level timings in milliseconds."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, voice)
    word_timings: list[dict[str, Any]] = []

    with open(out_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_ms = int(chunk["offset"] / 10_000)
                duration_ms = int(chunk["duration"] / 10_000)
                word_timings.append(
                    {
                        "word": chunk["text"],
                        "start_ms": start_ms,
                        "end_ms": start_ms + duration_ms,
                    }
                )

    # Fallback approximate timings if TTS stream didn't emit WordBoundary events
    if not word_timings and text.strip():
        words = text.strip().split()
        cursor = 0
        for w in words:
            dur = max(220, len(w) * 65)
            word_timings.append({"word": w, "start_ms": cursor, "end_ms": cursor + dur})
            cursor += dur + 40

    return word_timings


def generate_tts_sync(text: str, out_path: Path, voice: str = DEFAULT_ES_VOICE_F) -> list[dict[str, Any]]:
    return asyncio.run(synthesize_spanish_mp3(text, out_path, voice=voice))
