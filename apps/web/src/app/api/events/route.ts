import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supaFetch } from "@/lib/db";
import {
  computeNextItemState,
  computeWordStrength,
  mapEventToGrade,
  type ItemStateRow,
} from "@/lib/fsrs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cardId: string | null = body.cardId || null;
    const itemId: string | null = body.itemId || null;
    const rawEventType: string | null = body.eventType || null;
    const eventType: string | null =
      rawEventType === "mark_known"
        ? "know"
        : rawEventType === "impression"
          ? cardId
            ? "view"
            : null
          : rawEventType;
    const explicitRating: number | null = body.rating ?? null;
    const responseMs: number | null = body.responseMs ?? null;
    const dwellMs: number | null = body.dwellMs ?? null;
    const activeSecondsDelta: number = Math.max(0, Math.min(120, Number(body.activeSecondsDelta || 0)));

    let updatedState: ItemStateRow | null = null;
    let isNewItemLearned = false;
    let isReviewCompleted = false;

    // 1. Record event and update FSRS item state if applicable
    if (eventType) {
      const grade = mapEventToGrade(eventType, explicitRating, responseMs);

      await supaFetch("ezik_app_events", {
        method: "POST",
        body: {
          user_id: user.id,
          card_id: cardId,
          item_id: itemId,
          event_type: eventType,
          rating: grade ?? explicitRating,
          response_ms: responseMs,
          dwell_ms: dwellMs,
          payload: body.payload || null,
        },
      });

      if (eventType === "flag" && cardId) {
        await supaFetch(`ezik_app_cards?id=eq.${cardId}`, {
          method: "PATCH",
          body: { status: "flagged" },
        });
      }

      if (itemId && grade) {
        const existingRows = await supaFetch<ItemStateRow[]>("ezik_app_item_state", {
          params: {
            user_id: `eq.${user.id}`,
            item_id: `eq.${itemId}`,
            limit: "1",
          },
        });
        const existing = existingRows[0] || null;
        if (!existing || existing.seen_count === 0) {
          isNewItemLearned = true;
        } else {
          isReviewCompleted = true;
        }

        const nextState = computeNextItemState(
          user.id,
          itemId,
          existing,
          grade,
          eventType === "know"
        );

        const upserted = await supaFetch<ItemStateRow[]>("ezik_app_item_state", {
          method: "POST",
          params: { on_conflict: "user_id,item_id" },
          prefer: "resolution=merge-duplicates,return=representation",
          body: nextState,
        });
        updatedState = upserted[0] || nextState;
      }
    }

    // 2. Update ezik_app_daily_stats
    const todayIso = new Date().toISOString().slice(0, 10);
    const statRows = await supaFetch<
      Array<{
        active_seconds: number;
        cards_completed: number;
        new_items_learned: number;
        reviews_completed: number;
        correct_answers: number;
        total_answers: number;
      }>
    >("ezik_app_daily_stats", {
      params: {
        user_id: `eq.${user.id}`,
        day: `eq.${todayIso}`,
        target_lang: "eq.es",
        limit: "1",
      },
    });

    const cur = statRows[0] || {
      active_seconds: 0,
      cards_completed: 0,
      new_items_learned: 0,
      reviews_completed: 0,
      correct_answers: 0,
      total_answers: 0,
    };

    const nextDaily = {
      user_id: user.id,
      day: todayIso,
      target_lang: "es",
      active_seconds: cur.active_seconds + activeSecondsDelta,
      cards_completed:
        cur.cards_completed +
        (eventType === "complete" || eventType === "answer_correct" || eventType === "self_grade" ? 1 : 0),
      new_items_learned: cur.new_items_learned + (isNewItemLearned ? 1 : 0),
      reviews_completed: cur.reviews_completed + (isReviewCompleted ? 1 : 0),
      correct_answers: cur.correct_answers + (eventType === "answer_correct" ? 1 : 0),
      total_answers:
        cur.total_answers + (eventType === "answer_correct" || eventType === "answer_wrong" ? 1 : 0),
    };

    await supaFetch("ezik_app_daily_stats", {
      method: "POST",
      params: { on_conflict: "user_id,day,target_lang" },
      prefer: "resolution=merge-duplicates",
      body: nextDaily,
    });

    return NextResponse.json({
      ok: true,
      itemState: updatedState
        ? { ...updatedState, strength: computeWordStrength(updatedState) }
        : null,
      dailyStats: nextDaily,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record event" },
      { status: 500 }
    );
  }
}
