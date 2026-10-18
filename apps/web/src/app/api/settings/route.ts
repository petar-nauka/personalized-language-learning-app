import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supaFetch } from "@/lib/db";
import { getOrCreateUserSettings } from "@/lib/mixer";
import type { UserSettingsDTO } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getOrCreateUserSettings(user.id, "es");
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const allowedFields = [
      "active_pack_code",
      "current_stage",
      "current_cefr",
      "daily_minutes_goal",
      "daily_new_items_limit",
      "voice_accent",
      "audio_autoplay",
      "audio_slow_default",
      "muted",
      "bg_helper_level",
      "theme",
      "push_enabled",
      "push_subscription",
    ];

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of allowedFields) {
      if (body[k] !== undefined) {
        patch[k] = body[k];
      }
    }

    await getOrCreateUserSettings(user.id, "es");
    const updated = await supaFetch<UserSettingsDTO[]>(
      `ezik_app_settings?user_id=eq.${user.id}&target_lang=eq.es`,
      {
        method: "PATCH",
        prefer: "return=representation",
        body: patch,
      }
    );

    return NextResponse.json({ ok: true, settings: updated[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
