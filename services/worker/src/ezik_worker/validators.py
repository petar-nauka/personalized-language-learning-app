from __future__ import annotations

import random
import re
from typing import Any
from ezik_worker.models import (
    AudioBlurContent,
    CardType,
    DiglotWeaveContent,
    MicroBuilderContent,
    MultipleChoiceQuestion,
    PhraseSituationContent,
    SayItContent,
    ShadowingContent,
    SoundRuleContent,
    StoryXRayContent,
    TrapChoiceContent,
    VisualWordContent,
)

_WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")
_LATIN_RE = re.compile(r"[A-Za-z\u00C0-\u024F]")

CONTENT_MODEL_BY_TYPE: dict[CardType, Any] = {
    "sound_rule": SoundRuleContent,
    "visual_word": VisualWordContent,
    "phrase_situation": PhraseSituationContent,
    "micro_builder": MicroBuilderContent,
    "diglot_weave": DiglotWeaveContent,
    "story_xray": StoryXRayContent,
    "audio_blur": AudioBlurContent,
    "say_it": SayItContent,
    "shadowing": ShadowingContent,
    "trap_choice": TrapChoiceContent,
}


def has_mixed_script(text: str | None) -> bool:
    """Return True if any single word mixes Cyrillic and Latin characters (e.g. Haiku twin glitches)."""
    if not text:
        return False
    for word in _WORD_RE.findall(text):
        if _CYRILLIC_RE.search(word) and _LATIN_RE.search(word):
            return True
    return False


def check_spanish_punctuation(text: str) -> bool:
    """Verify that Spanish questions use ¿ and exclamations use ¡ when ending with ? or !."""
    if "?" in text and "¿" not in text:
        return False
    if "!" in text and "¡" not in text:
        return False
    return True


def shuffle_question_options(q: MultipleChoiceQuestion, rng: random.Random | None = None) -> MultipleChoiceQuestion:
    """Shuffle options so the correct answer is not always index 0, updating answer index."""
    r = rng or random
    correct_text = q.options[q.answer]
    shuffled = list(q.options)
    r.shuffle(shuffled)
    return q.model_copy(update={"options": shuffled, "answer": shuffled.index(correct_text)})


def shuffle_builder_tiles(content: MicroBuilderContent, rng: random.Random | None = None) -> MicroBuilderContent:
    """Ensure builder tiles are shuffled and not already in the exact target order."""
    r = rng or random
    tiles = list(content.tiles)
    for _ in range(5):
        r.shuffle(tiles)
        if tiles[: len(content.correct_sequence)] != content.correct_sequence:
            break
    return content.model_copy(update={"tiles": tiles})


def validate_and_normalize_card(card_type: CardType, raw_content: dict[str, Any], rng: random.Random | None = None) -> dict[str, Any]:
    """Validate card content against its strict Pydantic schema and randomize option/tile order."""
    model_cls = CONTENT_MODEL_BY_TYPE.get(card_type)
    if not model_cls:
        raise ValueError(f"Unsupported card_type: {card_type}")

    parsed = model_cls.model_validate(raw_content)

    # Check Bulgarian fields for mixed Cyrillic+Latin within a single word
    bg_fields: list[str | None] = []
    if hasattr(parsed, "phonetic_bg"):
        bg_fields.append(getattr(parsed, "phonetic_bg"))
    if hasattr(parsed, "bg"):
        bg_fields.append(getattr(parsed, "bg"))
    if hasattr(parsed, "bg_bridge"):
        bg_fields.append(getattr(parsed, "bg_bridge"))

    for f in bg_fields:
        if has_mixed_script(f):
            raise ValueError(f"Mixed Cyrillic/Latin script detected in field: {f}")

    # Shuffle multiple choice options or builder tiles
    if hasattr(parsed, "question") and isinstance(parsed.question, MultipleChoiceQuestion):
        parsed = parsed.model_copy(update={"question": shuffle_question_options(parsed.question, rng)})
    elif isinstance(parsed, MicroBuilderContent):
        parsed = shuffle_builder_tiles(parsed, rng)
    elif isinstance(parsed, TrapChoiceContent):
        r = rng or random
        correct_opt = parsed.options[parsed.answer]
        opts = list(parsed.options)
        r.shuffle(opts)
        parsed = parsed.model_copy(update={"options": opts, "answer": opts.index(correct_opt)})

    return parsed.model_dump()
