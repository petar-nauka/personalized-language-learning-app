import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supaFetch } from "@/lib/db";
import { getOrCreateUserSettings, getTodayStats } from "@/lib/mixer";
import type { PackDTO } from "@/lib/types";
import type { ItemStateRow } from "@/lib/fsrs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [settings, todayStats, packs, items, states] = await Promise.all([
      getOrCreateUserSettings(user.id, "es"),
      getTodayStats(user.id, "es"),
      supaFetch<PackDTO[]>("ezik_app_packs", {
        params: { target_lang: "eq.es", order: "seq_order.asc" },
      }),
      supaFetch<Array<{ id: string; pack_code: string }>>("ezik_app_items", {
        params: { target_lang: "eq.es", select: "id,pack_code" },
      }),
      supaFetch<ItemStateRow[]>("ezik_app_item_state", {
        params: { user_id: `eq.${user.id}` },
      }),
    ]);

    const stateByItem = new Map(states.map((s) => [s.item_id, s]));

    const enrichedPacks: PackDTO[] = packs.map((p) => {
      const packItems = items.filter((it) => it.pack_code === p.code);
      const seenCount = packItems.filter((it) => (stateByItem.get(it.id)?.seen_count ?? 0) > 0).length;
      const masteredCount = packItems.filter((it) => stateByItem.get(it.id)?.mastered).length;
      return {
        ...p,
        total_items: packItems.length,
        seen_items: seenCount,
        mastered_items: masteredCount,
      };
    });

    return NextResponse.json({
      settings,
      todayStats,
      packs: enrichedPacks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load today stats" },
      { status: 500 }
    );
  }
}
