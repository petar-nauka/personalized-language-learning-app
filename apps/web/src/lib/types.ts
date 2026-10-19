export type CardType =
  | "sound_rule"
  | "visual_word"
  | "phrase_situation"
  | "micro_builder"
  | "diglot_weave"
  | "story_xray"
  | "audio_blur"
  | "say_it"
  | "shadowing"
  | "trap_choice";

export interface MultipleChoiceQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explain?: string | null;
  mode?: string | null;
}

export interface SoundExample {
  es: string;
  phonetic: string;
  en: string;
  image_url?: string | null;
  audio_url?: string | null;
}

export interface SoundRuleContent {
  grapheme: string;
  phonetic_en: string;
  phonetic_bg: string;
  rule_title: string;
  rule_summary: string;
  examples: SoundExample[];
  question: MultipleChoiceQuestion;
}

export interface SentenceToken {
  es: string;
  en: string;
  lemma?: string | null;
  grammar?: string | null;
  phonetic?: string | null;
}

export interface VisualWordContent {
  item_id?: string | null;
  es: string;
  article?: "el" | "la" | "los" | "las" | null;
  noun: string;
  phonetic: string;
  en: string;
  bg: string;
  cognate_or_memory_tip?: string | null;
  bg_bridge?: string | null;
  mini_sentence: {
    es: string;
    en: string;
    tokens: SentenceToken[];
  };
  question: MultipleChoiceQuestion;
}

export interface PhraseSituationContent {
  situation_en: string;
  es: string;
  phonetic: string;
  en: string;
  bg_bridge?: string | null;
  tokens: SentenceToken[];
  reply_preview?: {
    waiter_es: string;
    waiter_en: string;
  } | null;
  question: MultipleChoiceQuestion;
}

export interface MicroBuilderContent {
  situation_en: string;
  prompt_en: string;
  target_es: string;
  tiles: string[];
  correct_sequence: string[];
  phonetic: string;
  explain: string;
}

export interface DiglotSegment {
  type: "en" | "es";
  text: string;
  en?: string | null;
  phonetic?: string | null;
  item_id?: string | null;
}

export interface DiglotWeaveContent {
  segments: DiglotSegment[];
  question: MultipleChoiceQuestion;
}

export interface StoryHighlight {
  phrase: string;
  item: string;
  en: string;
  why: string;
  bg_bridge?: string | null;
}

export interface StoryToken {
  w: string;
  en: string;
  lemma?: string | null;
  phonetic?: string | null;
}

export interface StoryXRayContent {
  title_es: string;
  title_en: string;
  text_es: string;
  translation_en: string;
  highlights: StoryHighlight[];
  tokens: StoryToken[];
  question: MultipleChoiceQuestion;
}

export interface AudioBlurContent {
  context_en: string;
  es: string;
  phonetic: string;
  en: string;
  question: MultipleChoiceQuestion;
}

export interface SayItContent {
  situation_en: string;
  prompt_en: string;
  hint_en?: string | null;
  target_es: string;
  alternative_es?: string | null;
  phonetic: string;
  notes?: string | null;
}

export interface ShadowingContent {
  es: string;
  phonetic: string;
  en: string;
  target_words: string[];
}

export interface TrapChoiceContent {
  situation_en: string;
  prompt: string;
  options: string[];
  answer: number;
  trap_title: string;
  explain_en: string;
  bg_bridge?: string | null;
}

export interface WordTiming {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface FeedCardDTO {
  id: string;
  target_lang: string;
  card_type: CardType;
  stage: number;
  pack_code: string | null;
  cefr: string;
  topic: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  image_url?: string | null;
  image_source?: string | null;
  image_license?: string | null;
  image_author?: string | null;
  audio_url?: string | null;
  word_timings?: WordTiming[] | null;
  source_url?: string | null;
  source_license?: string | null;
  target_item_id?: string | null;
  is_review?: boolean;
  saved?: boolean;
  item_step?: number;
  item_total_steps?: number;
}

export interface PackDTO {
  code: string;
  target_lang: string;
  seq_order: number;
  stage: number;
  cefr: string;
  title_en: string;
  title_bg: string;
  description_en: string;
  icon: string;
  total_items?: number;
  seen_items?: number;
  mastered_items?: number;
}

export interface ItemDTO {
  id: string;
  target_lang: string;
  pack_code: string | null;
  seq_order: number;
  kind: string;
  text: string;
  lemma: string;
  article?: "el" | "la" | "los" | "las" | null;
  phonetic_hint?: string | null;
  en_gloss: string;
  bg_gloss: string;
  en_explain?: string | null;
  bg_bridge?: string | null;
  example_text?: string | null;
  example_en?: string | null;
  cefr: string;
  image_url?: string | null;
  audio_url?: string | null;
  strength?: number;
  due?: string | null;
  mastered?: boolean;
  seen_count?: number;
}

export interface UserSettingsDTO {
  user_id: string;
  target_lang: string;
  ui_lang: string;
  current_cefr: string;
  current_stage: number;
  active_pack_code: string;
  daily_minutes_goal: number;
  daily_new_items_limit: number;
  voice_accent: string;
  audio_autoplay: boolean;
  audio_slow_default: boolean;
  muted: boolean;
  bg_helper_level: number;
  theme: "dark" | "light";
  push_enabled: boolean;
}

export interface TodayStatsDTO {
  day: string;
  active_seconds: number;
  cards_completed: number;
  new_items_learned: number;
  reviews_completed: number;
  correct_answers: number;
  total_answers: number;
  streak_days: number;
  due_reviews_count: number;
}
