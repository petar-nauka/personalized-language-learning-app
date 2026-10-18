from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv


def _find_env_file() -> Path | None:
    cur = Path(__file__).resolve()
    for parent in [cur.parent, *cur.parents]:
        candidate = parent / ".env"
        if candidate.is_file():
            return candidate
    return None


_env_path = _find_env_file()
if _env_path:
    load_dotenv(_env_path, override=False)


# Claude model constants
HAIKU_MODEL = os.getenv("CLAUDE_HAIKU_MODEL", "claude-haiku-4-5")
SONNET_MODEL = os.getenv("CLAUDE_SONNET_MODEL", "claude-sonnet-4-5")


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    service_role_key: str
    anthropic_api_key: str
    pixabay_api_key: str
    pexels_api_key: str
    unsplash_access_key: str
    repo_root: Path

    @classmethod
    def from_env(cls) -> "Settings":
        repo_root = _env_path.parent if _env_path else Path.cwd()
        return cls(
            supabase_url=os.getenv("SUPABASE_URL", "https://your-project.supabase.co").rstrip("/"),
            service_role_key=os.getenv("SERVICE_ROLE_KEY", ""),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
            pixabay_api_key=os.getenv("PIXABAY_API_KEY", ""),
            pexels_api_key=os.getenv("PEXELS_API_KEY", ""),
            unsplash_access_key=os.getenv("UNSPLASH_ACCESS_KEY", ""),
            repo_root=repo_root,
        )
