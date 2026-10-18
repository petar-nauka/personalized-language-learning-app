from __future__ import annotations

import json
import re
from typing import Any
import httpx
from ezik_worker.config import HAIKU_MODEL, SONNET_MODEL, Settings

# Approximate pricing per 1M tokens (USD) for safety guard
PRICE_PER_M: dict[str, tuple[float, float]] = {
    HAIKU_MODEL: (1.00, 5.00),
    SONNET_MODEL: (3.00, 15.00),
}

_JSON_BLOCK_RE = re.compile(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", re.DOTALL)


def extract_json(text: str) -> Any:
    text = text.strip()
    m = _JSON_BLOCK_RE.search(text)
    if m:
        text = m.group(1).strip()
    return json.loads(text)


class BudgetExceededError(RuntimeError):
    pass


class ClaudeClient:
    """Anthropic Messages API client with --max-usd budget tracking and Haiku thinking:disabled."""

    def __init__(self, settings: Settings | None = None, max_usd: float = 2.0) -> None:
        self.settings = settings or Settings.from_env()
        if not self.settings.anthropic_api_key:
            raise RuntimeError("Missing ANTHROPIC_API_KEY in .env")
        self.max_usd = max_usd
        self.spent_usd = 0.0
        self.input_tokens = 0
        self.output_tokens = 0
        self.http = httpx.Client(
            base_url="https://api.anthropic.com/v1",
            headers={
                "x-api-key": self.settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            timeout=60.0,
        )

    def close(self) -> None:
        self.http.close()

    def generate_json(
        self,
        prompt: str,
        system: str = "You are an expert Spanish language curriculum designer. Return ONLY valid JSON matching the requested schema.",
        model: str = HAIKU_MODEL,
        max_tokens: int = 1200,
    ) -> Any:
        if self.spent_usd >= self.max_usd:
            raise BudgetExceededError(f"Budget cap reached: ${self.spent_usd:.4f} >= ${self.max_usd:.2f}")

        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
        }
        # Gotcha from CLAUDE.md: Haiku thinks by default (4x tokens); disable thinking on Haiku, never on Sonnet 5.5
        if "haiku" in model.lower():
            payload["thinking"] = {"type": "disabled"}

        r = self.http.post("/messages", json=payload)
        r.raise_for_status()
        data = r.json()

        usage = data.get("usage") or {}
        in_tok = int(usage.get("input_tokens", 0))
        out_tok = int(usage.get("output_tokens", 0))
        in_price, out_price = PRICE_PER_M.get(model, (3.0, 15.0))
        cost = (in_tok * in_price + out_tok * out_price) / 1_000_000.0

        self.input_tokens += in_tok
        self.output_tokens += out_tok
        self.spent_usd += cost

        blocks = data.get("content") or []
        text_parts = [b.get("text", "") for b in blocks if b.get("type") == "text"]
        full_text = "\n".join(text_parts).strip()
        return extract_json(full_text)
