from __future__ import annotations

import argparse
from pathlib import Path
import sys
from ezik_worker.claude_client import ClaudeClient
from ezik_worker.config import Settings
from ezik_worker.curriculum import (
    SPANISH_PACKS,
    build_cards_for_items,
    build_seed_items_payload,
    generate_pack_items_with_claude,
    wiki_query_for_item_text,
)
from ezik_worker.db import SupabaseDB
from ezik_worker.images import ImageFinder
from ezik_worker.tts import DEFAULT_ES_VOICE_F, generate_tts_sync


def cmd_seed_curriculum(args: argparse.Namespace) -> None:
    db = SupabaseDB()
    try:
        packs = db.upsert_packs(SPANISH_PACKS)
        print(f"Upserted {len(packs)} curriculum packs in ezik_app_packs.")

        seed_items = build_seed_items_payload()
        inserted_items = db.upsert_items(seed_items)
        print(f"Upserted {len(inserted_items)} foundational items in ezik_app_items.")

        if args.ai_pack:
            pack_meta = next((p for p in SPANISH_PACKS if p["code"] == args.ai_pack), None)
            if not pack_meta:
                raise SystemExit(f"Unknown pack code: {args.ai_pack}")
            claude = ClaudeClient(max_usd=args.max_usd)
            try:
                ai_items = generate_pack_items_with_claude(claude, pack_meta, count=args.count)
                upserted = db.upsert_items(ai_items)
                print(
                    f"AI-generated and upserted {len(upserted)} items for {args.ai_pack} "
                    f"(spent ${claude.spent_usd:.4f})"
                )
            finally:
                claude.close()
    finally:
        db.close()


def cmd_fetch_images(args: argparse.Namespace) -> None:
    db = SupabaseDB()
    finder = ImageFinder()
    repo_root = Path(__file__).resolve().parents[4]
    images_dir = repo_root / "apps" / "web" / "public" / "images" / args.lang / "items"
    images_dir.mkdir(parents=True, exist_ok=True)
    try:
        items = db.list_items(target_lang=args.lang, pack_code=args.pack)
        missing = [it for it in items if not it.get("image_url") or args.force]
        print(f"Found {len(missing)} items needing images (out of {len(items)} total).")
        updated = 0
        item_img_map: dict[str, str] = {}
        for it in missing[: args.limit]:
            wiki_q = wiki_query_for_item_text(it["text"])
            search_q = f"{it['en_gloss']} {wiki_q}".strip()
            meta = finder.find_image(query_en=search_q, wiki_title=wiki_q)
            if meta:
                local_file = images_dir / f"{it['id']}.jpg"
                final_url = meta.image_url
                if finder.download_to_file(meta.image_url, local_file):
                    final_url = f"/images/{args.lang}/items/{it['id']}.jpg"
                db.update_item(
                    it["id"],
                    {
                        "image_url": final_url,
                        "image_source": meta.image_source,
                        "image_license": meta.image_license,
                        "image_author": meta.image_author,
                    },
                )
                item_img_map[it["id"]] = final_url
                updated += 1
                print(f"  [OK] {it['text']} -> {meta.image_source}: {final_url}")
            else:
                print(f"  [--] No image found for {it['text']} ({wiki_q})")

        # Sync ezik_app_cards image_url with their linked items
        if item_img_map:
            links = db.client.get("/ezik_app_card_items", params={"select": "card_id,item_id,role", "limit": "3000"}).json()
            card_updates = 0
            for link in links:
                iid = link.get("item_id")
                cid = link.get("card_id")
                if iid in item_img_map and cid:
                    db.update_card(cid, {"image_url": item_img_map[iid]})
                    card_updates += 1
            print(f"Synced local image_url across {card_updates} cards in ezik_app_cards.")
        print(f"Updated images for {updated} items.")
    finally:
        finder.close()
        db.close()


def cmd_generate_cards(args: argparse.Namespace) -> None:
    db = SupabaseDB()
    try:
        items = db.list_items(target_lang=args.lang, pack_code=args.pack)
        existing_cards = db.list_cards(target_lang=args.lang, pack_code=args.pack)

        # Build deduplication key: (card_type, pack_code, primary_spanish_text)
        seen_keys: set[tuple[str, str, str]] = set()
        for c in existing_cards:
            content = c.get("content") or {}
            sig = (
                content.get("es")
                or content.get("target_es")
                or content.get("grapheme")
                or content.get("title_es")
                or content.get("prompt")
                or (content.get("question") or {}).get("prompt")
                or ""
            )
            seen_keys.add((c["card_type"], c.get("pack_code") or "", sig))

        built = build_cards_for_items(items)
        inserted = 0
        for card, links in built:
            if args.pack and card.get("pack_code") != args.pack:
                continue
            content = card["content"]
            sig = (
                content.get("es")
                or content.get("target_es")
                or content.get("grapheme")
                or content.get("title_es")
                or content.get("prompt")
                or (content.get("question") or {}).get("prompt")
                or ""
            )
            key = (card["card_type"], card.get("pack_code") or "", sig)
            if key in seen_keys:
                continue
            db.insert_card(card, links)
            seen_keys.add(key)
            inserted += 1
        print(f"Inserted {inserted} new cards in ezik_app_cards (total existing before: {len(existing_cards)}).")
    finally:
        db.close()


def cmd_generate_audio(args: argparse.Namespace) -> None:
    settings = Settings.from_env()
    db = SupabaseDB(settings)
    out_dir = settings.repo_root / "apps" / "web" / "public" / "audio" / "es"
    try:
        items = db.list_items(target_lang="es", pack_code=args.pack)
        count = 0
        for it in items:
            if it.get("audio_url") and not args.force:
                continue
            if it["kind"] == "sound_rule":
                spoken = ", ".join(ex["es"] for ex in [
                    {"es": it.get("example_text") or it["lemma"]}
                ])
            else:
                spoken = it["text"]
            rel_url = f"/audio/es/items/{it['id']}.mp3"
            target_file = out_dir / "items" / f"{it['id']}.mp3"
            generate_tts_sync(spoken, target_file, voice=args.voice)
            db.update_item(it["id"], {"audio_url": rel_url})
            count += 1
            if count >= args.limit:
                break
        print(f"Generated TTS audio for {count} items in {out_dir / 'items'}.")
    finally:
        db.close()


def main(argv: list[str] | None = None) -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(prog="worker", description="Ezik Content, Image & Audio Worker")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_seed = sub.add_parser("seed-curriculum", help="Seed 20 packs and core Spanish items")
    p_seed.add_argument("--ai-pack", type=str, default=None, help="Optional pack code (e.g. es_06) to expand with Claude")
    p_seed.add_argument("--count", type=int, default=20, help="Number of AI items to generate")
    p_seed.add_argument("--max-usd", type=float, default=1.0, help="Max USD cap for Claude")
    p_seed.set_defaults(func=cmd_seed_curriculum)

    p_img = sub.add_parser("fetch-images", help="Fetch licensed images for items")
    p_img.add_argument("--lang", type=str, default="es")
    p_img.add_argument("--pack", type=str, default=None)
    p_img.add_argument("--limit", type=int, default=200)
    p_img.add_argument("--force", action="store_true")
    p_img.set_defaults(func=cmd_fetch_images)

    p_cards = sub.add_parser("generate-cards", help="Generate validated interactive cards for items")
    p_cards.add_argument("--lang", type=str, default="es")
    p_cards.add_argument("--pack", type=str, default=None)
    p_cards.set_defaults(func=cmd_generate_cards)

    p_tts = sub.add_parser("generate-audio", help="Generate Spanish TTS MP3 files")
    p_tts.add_argument("--pack", type=str, default=None)
    p_tts.add_argument("--voice", type=str, default=DEFAULT_ES_VOICE_F)
    p_tts.add_argument("--limit", type=int, default=100)
    p_tts.add_argument("--force", action="store_true")
    p_tts.set_defaults(func=cmd_generate_audio)

    parsed = parser.parse_args(argv if argv is not None else sys.argv[1:])
    parsed.func(parsed)


if __name__ == "__main__":
    main()
