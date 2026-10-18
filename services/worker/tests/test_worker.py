from __future__ import annotations

import random
import pytest
from ezik_worker.curriculum import (
    SPANISH_PACKS,
    build_cards_for_items,
    build_seed_items_payload,
)
from ezik_worker.validators import (
    check_spanish_punctuation,
    has_mixed_script,
    validate_and_normalize_card,
)


def test_twenty_packs_present_and_ordered() -> None:
    assert len(SPANISH_PACKS) == 20
    codes = [p["code"] for p in SPANISH_PACKS]
    assert codes[0] == "es_01"
    assert codes[-1] == "es_20"


def test_mixed_script_detection() -> None:
    assert has_mixed_script("котката") is False
    assert has_mixed_script("В испанския 'el' е мъжки род") is False
    # Cyrillic 'к' + Latin 'o' + Cyrillic 'тка'
    assert has_mixed_script("кoтка") is True
    assert has_mixed_script("Франциscan") is True


def test_spanish_punctuation_check() -> None:
    assert check_spanish_punctuation("¿Cómo te llamas?") is True
    assert check_spanish_punctuation("¡Hola!") is True
    assert check_spanish_punctuation("Cómo te llamas?") is False
    assert check_spanish_punctuation("Hola!") is False


def test_seed_items_and_card_generation() -> None:
    items = build_seed_items_payload()
    assert len(items) >= 50
    for idx, it in enumerate(items):
        it["id"] = f"00000000-0000-0000-0000-{idx:012d}"
        assert has_mixed_script(it["bg_gloss"]) is False
        assert has_mixed_script(it.get("bg_bridge")) is False

    cards = build_cards_for_items(items, rng=random.Random(123))
    assert len(cards) >= 120
    card_types = {c[0]["card_type"] for c in cards}
    assert card_types == {
        "sound_rule",
        "visual_word",
        "phrase_situation",
        "micro_builder",
        "diglot_weave",
        "story_xray",
        "audio_blur",
        "say_it",
        "shadowing",
        "trap_choice",
    }


def test_validate_rejects_missing_builder_tile() -> None:
    with pytest.raises(ValueError):
        validate_and_normalize_card(
            "micro_builder",
            {
                "situation_en": "Ask for the bill",
                "prompt_en": "The bill, please.",
                "target_es": "La cuenta, por favor.",
                "tiles": ["La", "por", "favor."],  # missing 'cuenta,'
                "correct_sequence": ["La", "cuenta,", "por", "favor."],
                "phonetic": "ла КУЕН-та",
                "explain": "test",
            },
        )
