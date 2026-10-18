import { supaFetch } from "./db";
import type {
  CardType,
  FeedCardDTO,
  PackDTO,
  TodayStatsDTO,
  UserSettingsDTO,
} from "./types";
import type { ItemStateRow } from "./fsrs";

const INTRO_CARD_TYPES: Set<CardType> = new Set([
  "sound_rule",
  "visual_word",
  "phrase_situation",
  "diglot_weave",
  "story_xray",
  "trap_choice",
]);

const PRACTICE_CARD_TYPES: Set<CardType> = new Set([
  "micro_builder",
  "audio_blur",
  "say_it",
  "shadowing",
  "trap_choice",
]);

const AUDIO_REQUIRED_TYPES: Set<CardType> = new Set(["audio_blur", "shadowing"]);

export async function getOrCreateUserSettings(
  userId: string,
  targetLang: string = "es"
): Promise<UserSettingsDTO> {
  const rows = await supaFetch<UserSettingsDTO[]>("ezik_app_settings", {
    params: {
      user_id: `eq.${userId}`,
      target_lang: `eq.${targetLang}`,
      limit: "1",
    },
  });
  if (rows.length > 0) return rows[0];

  const created = await supaFetch<UserSettingsDTO[]>("ezik_app_settings", {
    method: "POST",
    prefer: "return=representation",
    body: {
      user_id: userId,
      target_lang: targetLang,
      ui_lang: "en",
      current_cefr: "A0",
      current_stage: 0,
      active_pack_code: "es_01",
      daily_minutes_goal: 20,
      daily_new_items_limit: 15,
    },
  });
  return created[0];
}

export async function getTodayStats(
  userId: string,
  targetLang: string = "es"
): Promise<TodayStatsDTO> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const rows = await supaFetch<
    Array<{
      day: string;
      active_seconds: number;
      cards_completed: number;
      new_items_learned: number;
      reviews_completed: number;
      correct_answers: number;
      total_answers: number;
    }>
  >("ezik_app_daily_stats", {
    params: {
      user_id: `eq.${userId}`,
      target_lang: `eq.${targetLang}`,
      order: "day.desc",
      limit: "30",
    },
  });

  const todayRow = rows.find((r) => r.day === todayIso) || {
    day: todayIso,
    active_seconds: 0,
    cards_completed: 0,
    new_items_learned: 0,
    reviews_completed: 0,
    correct_answers: 0,
    total_answers: 0,
  };

  // Calculate consecutive day streak (where active_seconds >= 60 or cards_completed >= 3)
  const activeDays = new Set(
    rows
      .filter((r) => r.active_seconds >= 60 || r.cards_completed >= 3)
      .map((r) => r.day)
  );
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i++) {
    const dStr = cursor.toISOString().slice(0, 10);
    if (activeDays.has(dStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // Count due reviews
  const nowIso = new Date().toISOString();
  const dueRows = await supaFetch<Array<{ item_id: string }>>("ezik_app_item_state", {
    params: {
      user_id: `eq.${userId}`,
      mastered: "eq.false",
      due: `lte.${nowIso}`,
      select: "item_id",
    },
  });

  return {
    ...todayRow,
    streak_days: streak,
    due_reviews_count: dueRows.length,
  };
}

export async function assembleFeedBatch(
  userId: string,
  limit: number = 10,
  overridePack?: string | null
): Promise<{
  cards: FeedCardDTO[];
  activePack: PackDTO | null;
  stage: number;
  settings: UserSettingsDTO;
  todayStats: TodayStatsDTO;
}> {
  let settings = await getOrCreateUserSettings(userId, "es");

  // 1. Load all packs and user's item states
  const [packs, allItems, itemStates, recentEvents] = await Promise.all([
    supaFetch<PackDTO[]>("ezik_app_packs", {
      params: { target_lang: "eq.es", order: "seq_order.asc" },
    }),
    supaFetch<Array<{ id: string; pack_code: string; seq_order: number; audio_url: string | null; image_url: string | null }>>(
      "ezik_app_items",
      {
        params: {
          target_lang: "eq.es",
          select: "id,pack_code,seq_order,audio_url,image_url",
          order: "pack_code.asc,seq_order.asc",
        },
      }
    ),
    supaFetch<ItemStateRow[]>("ezik_app_item_state", {
      params: { user_id: `eq.${userId}` },
    }),
    supaFetch<Array<{ card_id: string; event_type: string }>>("ezik_app_events", {
      params: {
        user_id: `eq.${userId}`,
        event_type: "in.(complete,know,save)",
        order: "created_at.desc",
        limit: "400",
      },
    }),
  ]);

  const stateByItem = new Map<string, ItemStateRow>();
  for (const st of itemStates) {
    stateByItem.set(st.item_id, st);
  }
  const itemMetaById = new Map(allItems.map((it) => [it.id, it]));

  // 2. Check Auto-Progression: if >= 75% of items in active_pack_code are seen or mastered, unlock next pack
  let activePackCode = overridePack || settings.active_pack_code || "es_01";
  if (!overridePack) {
    const packItems = allItems.filter((it) => it.pack_code === activePackCode);
    if (packItems.length > 0) {
      const seenInPack = packItems.filter((it) => {
        const st = stateByItem.get(it.id);
        return st && (st.seen_count >= 1 || st.mastered);
      }).length;
      if (seenInPack / packItems.length >= 0.75) {
        const curPackIdx = packs.findIndex((p) => p.code === activePackCode);
        if (curPackIdx >= 0 && curPackIdx + 1 < packs.length) {
          const nextPack = packs[curPackIdx + 1];
          const nextPackItems = allItems.filter((it) => it.pack_code === nextPack.code);
          if (nextPackItems.length > 0) {
            activePackCode = nextPack.code;
            const patched = await supaFetch<UserSettingsDTO[]>(
              `ezik_app_settings?user_id=eq.${userId}&target_lang=eq.es`,
              {
                method: "PATCH",
                prefer: "return=representation",
                body: {
                  active_pack_code: nextPack.code,
                  current_stage: nextPack.stage,
                  current_cefr: nextPack.cefr,
                },
              }
            );
            if (patched.length > 0) settings = patched[0];
          }
        }
      }
    }
  }

  const activePack = packs.find((p) => p.code === activePackCode) || packs[0] || null;
  const stage = activePack ? activePack.stage : settings.current_stage;

  // 3. Load candidate cards and card-item links
  const [cardsRaw, cardLinks] = await Promise.all([
    supaFetch<FeedCardDTO[]>("ezik_app_cards", {
      params: {
        target_lang: "eq.es",
        status: "eq.ok",
        order: "pack_code.asc,stage.asc,created_at.asc",
        limit: "1000",
      },
    }),
    supaFetch<Array<{ card_id: string; item_id: string; role: string }>>("ezik_app_card_items", {
      params: { select: "card_id,item_id,role", limit: "2000" },
    }),
  ]);

  const targetItemByCard = new Map<string, string>();
  for (const link of cardLinks) {
    if (link.role === "target" || !targetItemByCard.has(link.card_id)) {
      targetItemByCard.set(link.card_id, link.item_id);
    }
  }

  const completedCardIds = new Set(
    recentEvents.filter((e) => e.event_type === "complete").map((e) => e.card_id)
  );
  const savedCardIds = new Set(
    recentEvents.filter((e) => e.event_type === "save").map((e) => e.card_id)
  );

  // Enrich cards with latest item image/audio if card didn't have it at creation time
  const allCards: FeedCardDTO[] = cardsRaw
    .map((c) => {
      const itemId = targetItemByCard.get(c.id) || c.content?.item_id || null;
      const itemMeta = itemId ? itemMetaById.get(itemId) : undefined;
      return {
        ...c,
        image_url: c.image_url || itemMeta?.image_url || null,
        audio_url: c.audio_url || itemMeta?.audio_url || null,
        target_item_id: itemId,
        saved: savedCardIds.has(c.id),
      };
    })
    .filter((c) => {
      if (settings.muted && AUDIO_REQUIRED_TYPES.has(c.card_type)) {
        return false;
      }
      const itemId = c.target_item_id;
      if (itemId && stateByItem.get(itemId)?.mastered) {
        return false;
      }
      return true;
    });

  // Partition candidate pools:
  // Pool A: Due FSRS reviews (due <= now, seen_count >= 1, not mastered)
  const nowMs = Date.now();
  const dueItemIds = new Set(
    itemStates
      .filter((st) => !st.mastered && st.seen_count >= 1 && new Date(st.due).getTime() <= nowMs)
      .map((st) => st.item_id)
  );

  const reviewPool = allCards.filter(
    (c) => c.target_item_id && dueItemIds.has(c.target_item_id) && !completedCardIds.has(c.id)
  );

  // Pool B: New / Intro cards from active pack (or adjacent packs if active pack is nearly done)
  const introPoolActive = allCards.filter(
    (c) =>
      c.pack_code === activePackCode &&
      INTRO_CARD_TYPES.has(c.card_type) &&
      !completedCardIds.has(c.id)
  );
  const introPoolFallback = allCards.filter(
    (c) => INTRO_CARD_TYPES.has(c.card_type) && !completedCardIds.has(c.id)
  );

  // Pool C: Active practice cards (micro_builder, audio_blur, say_it, shadowing, trap_choice)
  // Only for items already seen OR being introduced in this batch
  const practicePool = allCards.filter(
    (c) => PRACTICE_CARD_TYPES.has(c.card_type) && !completedCardIds.has(c.id)
  );

  const selected: FeedCardDTO[] = [];
  const usedIds = new Set<string>();
  const batchIntroducedItemIds: string[] = [];

  const canFollow = (candidate: FeedCardDTO): boolean => {
    if (selected.length === 0) return true;
    const prev = selected[selected.length - 1];
    // Avoid two identical card_types in a row once past the first 4 sound_rule/visual_word cards
    if (prev.card_type === candidate.card_type && candidate.card_type !== "visual_word") {
      return false;
    }
    if (prev.target_item_id && prev.target_item_id === candidate.target_item_id) {
      return false;
    }
    return true;
  };

  const pickFrom = (pool: FeedCardDTO[], markReview = false): FeedCardDTO | null => {
    const valid = pool.filter((c) => !usedIds.has(c.id) && canFollow(c));
    const list = valid.length > 0 ? valid : pool.filter((c) => !usedIds.has(c.id));
    if (list.length === 0) return null;
    const chosen = list[0];
    usedIds.add(chosen.id);
    if (chosen.target_item_id) {
      batchIntroducedItemIds.push(chosen.target_item_id);
    }
    return { ...chosen, is_review: markReview };
  };

  // Assemble slots (60% new/intro, 25% active practice + short-term echo, 15% FSRS review)
  for (let i = 0; i < limit; i++) {
    let picked: FeedCardDTO | null = null;

    // Slot 2 and 7: FSRS Due Review if available
    if ((i === 2 || i === 7) && reviewPool.length > 0) {
      picked = pickFrom(reviewPool, true);
    }

    // Slot 4 and 8: Short-term Echo Practice for an item introduced 3-4 cards earlier in this batch!
    if (!picked && (i === 4 || i === 8 || i === 6)) {
      const echoPool = practicePool.filter(
        (c) =>
          c.target_item_id &&
          (batchIntroducedItemIds.includes(c.target_item_id) ||
            (stateByItem.get(c.target_item_id)?.seen_count ?? 0) >= 1)
      );
      picked = pickFrom(echoPool, false);
    }

    // Default: New / Intro card from active pack
    if (!picked) {
      picked = pickFrom(introPoolActive, false) || pickFrom(introPoolFallback, false);
    }

    // Fallback to any unseen card or any card if user completed everything
    if (!picked) {
      picked = pickFrom(practicePool, false) || pickFrom(allCards, false);
    }

    if (picked) {
      selected.push(picked);
    }
  }

  const todayStats = await getTodayStats(userId, "es");
  return {
    cards: selected,
    activePack,
    stage,
    settings,
    todayStats,
  };
}
