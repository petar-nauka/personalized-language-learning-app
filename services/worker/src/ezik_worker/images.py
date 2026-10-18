from __future__ import annotations

from dataclasses import dataclass
import html
import re
import httpx
from ezik_worker.config import Settings

USER_AGENT = "EzikAppWorker/0.1 (https://ezik.example.com; contact: you@example.com)"
_TAG_RE = re.compile(r"<[^>]+>")

ALLOWED_WIKI_LICENSES = {
    "cc0",
    "public domain",
    "pd",
    "cc-by",
    "cc by",
    "cc-by-sa",
    "cc by-sa",
}


@dataclass(frozen=True)
class ImageMeta:
    image_url: str
    image_source: str
    image_license: str
    image_author: str


def _clean_html(raw: str | None) -> str:
    if not raw:
        return ""
    return html.unescape(_TAG_RE.sub("", raw)).strip()


class ImageFinder:
    """Fetches licensed visual photos from Pixabay, Pexels, Wikipedia PageSummary, and Wikimedia Commons."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings.from_env()
        self.http = httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=15.0, follow_redirects=True)

    def close(self) -> None:
        self.http.close()

    def find_image(self, query_en: str, wiki_title: str | None = None) -> ImageMeta | None:
        # 1. Try Pixabay if API key is configured
        if self.settings.pixabay_api_key:
            res = self._search_pixabay(query_en)
            if res:
                return res

        # 2. Try Pexels if API key is configured
        if self.settings.pexels_api_key:
            res = self._search_pexels(query_en)
            if res:
                return res

        # 3. Try Wikipedia REST summary thumbnail (fast, curated lead image for concrete nouns/places)
        if wiki_title:
            res = self._fetch_wikipedia_summary_image(wiki_title)
            if res:
                return res

        # 4. Fallback to Wikimedia Commons search with license check
        res = self._search_wikimedia_commons(query_en)
        if res:
            return res

        if wiki_title and wiki_title.lower() != query_en.lower():
            return self._fetch_wikipedia_summary_image(query_en)
        return None

    def _search_pixabay(self, query: str) -> ImageMeta | None:
        try:
            r = self.http.get(
                "https://pixabay.com/api/",
                params={
                    "key": self.settings.pixabay_api_key,
                    "q": query,
                    "image_type": "photo",
                    "orientation": "horizontal",
                    "safesearch": "true",
                    "per_page": 5,
                },
            )
            if r.status_code != 200:
                return None
            hits = r.json().get("hits") or []
            if not hits:
                return None
            top = hits[0]
            url = top.get("webformatURL") or top.get("largeImageURL")
            if not url:
                return None
            return ImageMeta(
                image_url=url,
                image_source="pixabay",
                image_license="Pixabay Content License",
                image_author=top.get("user") or "Pixabay",
            )
        except Exception:
            return None

    def _search_pexels(self, query: str) -> ImageMeta | None:
        try:
            r = self.http.get(
                "https://api.pexels.com/v1/search",
                headers={"Authorization": self.settings.pexels_api_key},
                params={"query": query, "per_page": 3, "orientation": "landscape"},
            )
            if r.status_code != 200:
                return None
            photos = r.json().get("photos") or []
            if not photos:
                return None
            top = photos[0]
            url = (top.get("src") or {}).get("large") or (top.get("src") or {}).get("medium")
            if not url:
                return None
            return ImageMeta(
                image_url=url,
                image_source="pexels",
                image_license="Pexels License",
                image_author=top.get("photographer") or "Pexels",
            )
        except Exception:
            return None

    def _fetch_wikipedia_summary_image(self, title: str) -> ImageMeta | None:
        slug = title.strip().replace(" ", "_")
        try:
            r = self.http.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{slug}")
            if r.status_code != 200:
                return None
            data = r.json()
            thumb = (data.get("thumbnail") or {}).get("source")
            if not thumb:
                return None
            return ImageMeta(
                image_url=thumb,
                image_source="wikimedia",
                image_license="CC BY-SA / Public Domain (Wikimedia)",
                image_author="Wikipedia / Wikimedia Commons",
            )
        except Exception:
            return None

    def download_to_file(self, url: str, dest_path: Any) -> bool:
        try:
            r = self.http.get(url)
            if r.status_code != 200 or not r.content:
                return False
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_bytes(r.content)
            return True
        except Exception:
            return False

    def _search_wikimedia_commons(self, query: str) -> ImageMeta | None:
        try:
            r = self.http.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "format": "json",
                    "generator": "search",
                    "gsrsearch": f"filetype:bitmap {query}",
                    "gsrnamespace": 6,
                    "gsrlimit": 5,
                    "prop": "imageinfo",
                    "iiprop": "url|extmetadata",
                    "iiurlwidth": 800,
                },
            )
            if r.status_code != 200:
                return None
            pages = (r.json().get("query") or {}).get("pages") or {}
            for page in pages.values():
                infos = page.get("imageinfo") or []
                if not infos:
                    continue
                info = infos[0]
                ext = info.get("extmetadata") or {}
                lic_short = _clean_html((ext.get("LicenseShortName") or {}).get("value", "")).lower()
                if not any(ok in lic_short for ok in ALLOWED_WIKI_LICENSES):
                    continue
                url = info.get("thumburl") or info.get("url")
                if not url or url.endswith(".svg") or url.endswith(".tif"):
                    continue
                artist = _clean_html((ext.get("Artist") or {}).get("value", "Wikimedia Commons"))[:80]
                lic_display = _clean_html((ext.get("LicenseShortName") or {}).get("value", "CC BY-SA"))
                return ImageMeta(
                    image_url=url,
                    image_source="wikimedia",
                    image_license=lic_display,
                    image_author=artist or "Wikimedia Commons",
                )
        except Exception:
            return None
        return None
