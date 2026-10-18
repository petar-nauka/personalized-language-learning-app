from __future__ import annotations

from typing import Any
import httpx
from ezik_worker.config import Settings


class SupabaseDB:
    """Server-side PostgREST client for ezik_app_* tables using SERVICE_ROLE_KEY."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings.from_env()
        if not self.settings.service_role_key:
            raise RuntimeError("Missing SERVICE_ROLE_KEY in environment/.env")
        self.base_url = f"{self.settings.supabase_url}/rest/v1"
        self.headers = {
            "apikey": self.settings.service_role_key,
            "Authorization": f"Bearer {self.settings.service_role_key}",
            "Content-Type": "application/json",
        }
        self.client = httpx.Client(base_url=self.base_url, headers=self.headers, timeout=30.0)

    def close(self) -> None:
        self.client.close()

    def upsert_packs(self, packs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not packs:
            return []
        r = self.client.post(
            "/ezik_app_packs",
            params={"on_conflict": "code"},
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
            json=packs,
        )
        r.raise_for_status()
        return r.json()

    def upsert_items(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not items:
            return []
        r = self.client.post(
            "/ezik_app_items",
            params={"on_conflict": "target_lang,text,kind"},
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
            json=items,
        )
        r.raise_for_status()
        return r.json()

    def list_items(self, target_lang: str = "es", pack_code: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {
            "target_lang": f"eq.{target_lang}",
            "order": "pack_code.asc,seq_order.asc",
            "limit": "1000",
        }
        if pack_code:
            params["pack_code"] = f"eq.{pack_code}"
        r = self.client.get("/ezik_app_items", params=params)
        r.raise_for_status()
        return r.json()

    def update_item(self, item_id: str, patch: dict[str, Any]) -> None:
        r = self.client.patch(f"/ezik_app_items?id=eq.{item_id}", json=patch)
        r.raise_for_status()

    def list_cards(self, target_lang: str = "es", pack_code: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {
            "target_lang": f"eq.{target_lang}",
            "order": "created_at.asc",
            "limit": "2000",
        }
        if pack_code:
            params["pack_code"] = f"eq.{pack_code}"
        r = self.client.get("/ezik_app_cards", params=params)
        r.raise_for_status()
        return r.json()

    def insert_card(self, card: dict[str, Any], item_links: list[tuple[str, str]] | None = None) -> dict[str, Any]:
        r = self.client.post(
            "/ezik_app_cards",
            headers={"Prefer": "return=representation"},
            json=card,
        )
        r.raise_for_status()
        created = r.json()[0]
        if item_links:
            links_payload = [
                {"card_id": created["id"], "item_id": item_id, "role": role}
                for item_id, role in item_links
            ]
            r_links = self.client.post(
                "/ezik_app_card_items",
                params={"on_conflict": "card_id,item_id"},
                headers={"Prefer": "resolution=merge-duplicates"},
                json=links_payload,
            )
            r_links.raise_for_status()
        return created

    def update_card(self, card_id: str, patch: dict[str, Any]) -> None:
        r = self.client.patch(f"/ezik_app_cards?id=eq.{card_id}", json=patch)
        r.raise_for_status()
