import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FSRSCard,
  type Grade,
} from "ts-fsrs";

const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
  enable_short_term: true,
});

const scheduler = fsrs(params);

export interface ItemStateRow {
  user_id: string;
  item_id: string;
  state: number;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_rating: number | null;
  last_review: string | null;
  mastered: boolean;
  seen_count: number;
}

export function computeWordStrength(row?: Partial<ItemStateRow> | null): number {
  if (!row || !row.seen_count) return 0;
  if (row.mastered) return 5;
  const s = row.stability || 0;
  if (row.state === State.Learning || row.state === State.Relearning || s < 1) return 1;
  if (s < 4) return 2;
  if (s < 14) return 3;
  if (s < 30) return 4;
  return 5;
}

export function mapEventToGrade(
  eventType: string,
  explicitRating?: number | null,
  responseMs?: number | null
): Grade | null {
  if (explicitRating && explicitRating >= 1 && explicitRating <= 4) {
    return explicitRating as Grade;
  }
  switch (eventType) {
    case "tap_xray":
    case "answer_wrong":
      return Rating.Again;
    case "answer_correct":
      if (responseMs && responseMs > 9000) {
        return Rating.Hard;
      }
      return Rating.Good;
    case "speak_ok":
      return Rating.Good;
    case "know":
      return Rating.Easy;
    default:
      return null;
  }
}

export function computeNextItemState(
  userId: string,
  itemId: string,
  existing: ItemStateRow | null,
  grade: Grade,
  markMastered: boolean = false,
  now: Date = new Date()
): ItemStateRow {
  const baseCard: FSRSCard = existing
    ? {
        due: new Date(existing.due),
        stability: existing.stability,
        difficulty: existing.difficulty,
        elapsed_days: existing.elapsed_days,
        scheduled_days: existing.scheduled_days,
        reps: existing.reps,
        lapses: existing.lapses,
        state: existing.state as State,
        last_review: existing.last_review ? new Date(existing.last_review) : undefined,
      }
    : createEmptyCard(now);

  const scheduling = scheduler.repeat(baseCard, now);
  const nextCard = scheduling[grade].card;

  return {
    user_id: userId,
    item_id: itemId,
    state: nextCard.state,
    due: nextCard.due.toISOString(),
    stability: nextCard.stability,
    difficulty: nextCard.difficulty,
    elapsed_days: nextCard.elapsed_days,
    scheduled_days: nextCard.scheduled_days,
    reps: nextCard.reps,
    lapses: nextCard.lapses,
    last_rating: grade,
    last_review: now.toISOString(),
    mastered: markMastered || (existing?.mastered ?? false),
    seen_count: (existing?.seen_count ?? 0) + 1,
  };
}
