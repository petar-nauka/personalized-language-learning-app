from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, model_validator


CardType = Literal[
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
]

ItemKind = Literal[
    "sound_rule",
    "cognate",
    "noun",
    "verb",
    "adjective",
    "survival_phrase",
    "grammar_pattern",
    "connector",
]


class MultipleChoiceQuestion(BaseModel):
    prompt: str = Field(..., min_length=3)
    options: list[str] = Field(..., min_length=2, max_length=4)
    answer: int = Field(..., ge=0)
    explain: str | None = None
    mode: str | None = None

    @model_validator(mode="after")
    def check_answer_bounds(self) -> "MultipleChoiceQuestion":
        if self.answer >= len(self.options):
            raise ValueError(f"answer index {self.answer} out of range for {len(self.options)} options")
        if len(set(self.options)) != len(self.options):
            raise ValueError("options must be unique")
        return self


# 1. sound_rule
class SoundExample(BaseModel):
    es: str
    phonetic: str
    en: str
    image_url: str | None = None
    audio_url: str | None = None


class SoundRuleContent(BaseModel):
    grapheme: str
    phonetic_en: str
    phonetic_bg: str
    rule_title: str
    rule_summary: str
    examples: list[SoundExample] = Field(..., min_length=2, max_length=4)
    question: MultipleChoiceQuestion


# 2. visual_word
class SentenceToken(BaseModel):
    es: str
    en: str
    lemma: str | None = None
    grammar: str | None = None
    phonetic: str | None = None


class MiniSentence(BaseModel):
    es: str
    en: str
    tokens: list[SentenceToken] = Field(default_factory=list)


class VisualWordContent(BaseModel):
    item_id: str | None = None
    es: str
    article: Literal["el", "la", "los", "las"] | None = None
    noun: str
    phonetic: str
    en: str
    bg: str
    cognate_or_memory_tip: str | None = None
    bg_bridge: str | None = None
    mini_sentence: MiniSentence
    question: MultipleChoiceQuestion


# 3. phrase_situation
class ReplyPreview(BaseModel):
    waiter_es: str
    waiter_en: str


class PhraseSituationContent(BaseModel):
    situation_en: str
    es: str
    phonetic: str
    en: str
    bg_bridge: str | None = None
    tokens: list[SentenceToken] = Field(..., min_length=1)
    reply_preview: ReplyPreview | None = None
    question: MultipleChoiceQuestion


# 4. micro_builder
class MicroBuilderContent(BaseModel):
    situation_en: str
    prompt_en: str
    target_es: str
    tiles: list[str] = Field(..., min_length=2)
    correct_sequence: list[str] = Field(..., min_length=2)
    phonetic: str
    explain: str

    @model_validator(mode="after")
    def check_tiles_contain_sequence(self) -> "MicroBuilderContent":
        remaining = list(self.tiles)
        for token in self.correct_sequence:
            if token not in remaining:
                raise ValueError(f"Tile '{token}' from correct_sequence is missing from tiles {self.tiles}")
            remaining.remove(token)
        return self


# 5. diglot_weave
class DiglotSegment(BaseModel):
    type: Literal["en", "es"]
    text: str
    en: str | None = None
    phonetic: str | None = None
    item_id: str | None = None


class DiglotWeaveContent(BaseModel):
    segments: list[DiglotSegment] = Field(..., min_length=2)
    question: MultipleChoiceQuestion


# 6. story_xray
class StoryHighlight(BaseModel):
    phrase: str
    item: str
    en: str
    why: str
    bg_bridge: str | None = None


class StoryToken(BaseModel):
    w: str
    en: str
    lemma: str | None = None
    phonetic: str | None = None


class StoryXRayContent(BaseModel):
    title_es: str
    title_en: str
    text_es: str
    translation_en: str
    highlights: list[StoryHighlight] = Field(default_factory=list)
    tokens: list[StoryToken] = Field(..., min_length=3)
    question: MultipleChoiceQuestion


# 7. audio_blur
class AudioBlurContent(BaseModel):
    context_en: str
    es: str
    phonetic: str
    en: str
    question: MultipleChoiceQuestion


# 8. say_it
class SayItContent(BaseModel):
    situation_en: str
    prompt_en: str
    hint_en: str | None = None
    target_es: str
    alternative_es: str | None = None
    phonetic: str
    notes: str | None = None


# 9. shadowing
class ShadowingContent(BaseModel):
    es: str
    phonetic: str
    en: str
    target_words: list[str] = Field(..., min_length=1)


# 10. trap_choice
class TrapChoiceContent(BaseModel):
    situation_en: str
    prompt: str
    options: list[str] = Field(..., min_length=2, max_length=3)
    answer: int = Field(..., ge=0)
    trap_title: str
    explain_en: str
    bg_bridge: str | None = None

    @model_validator(mode="after")
    def check_bounds(self) -> "TrapChoiceContent":
        if self.answer >= len(self.options):
            raise ValueError("answer out of range")
        return self
