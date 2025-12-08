import os
from typing import List, Dict, Any

import pandas as pd
import feedparser
from kestra import Kestra


def parse_rss_urls(env_value: str) -> List[str]:
    """
    Parse a comma-separated list of RSS URLs from an env var.
    """
    return [u.strip() for u in env_value.split(",") if u.strip()]


def fetch_feed_items(url: str) -> List[Dict[str, Any]]:
    """
    Fetch a single RSS/Atom feed and return a list of normalized item dicts.
    """
    feed = feedparser.parse(url)

    feed_title = getattr(feed.feed, "title", "") if hasattr(feed, "feed") else ""

    rows: List[Dict[str, Any]] = []
    for entry in getattr(feed, "entries", []):
        rows.append(
            {
                "source_url": url,
                "feed_title": feed_title,
                "item_title": getattr(entry, "title", ""),
                "link": getattr(entry, "link", ""),
                "published": getattr(entry, "published", ""),
                "summary": getattr(entry, "summary", "")
                or getattr(entry, "description", ""),
            }
        )

    return rows


def main() -> None:
    # Read comma-separated RSS URLs from env
    rss_env = os.environ.get("RSS_URLS", "")
    if not rss_env.strip():
        raise ValueError("Environment variable 'RSS_URLS' is required and cannot be empty")

    urls = parse_rss_urls(rss_env)
    if not urls:
        raise ValueError("No valid RSS URLs found in 'RSS_URLS'")

    # Fetch all feeds and flatten into a single list of rows
    all_rows: List[Dict[str, Any]] = []
    for url in urls:
        all_rows.extend(fetch_feed_items(url))

    # Build DataFrame and write to CSV
    df = pd.DataFrame(all_rows)

    output_filename = os.environ.get("FILENAME", "rss_feeds.csv")
    df.to_csv(output_filename, index=False)

    # Expose basic metadata back to Kestra
    Kestra.outputs(
        {
            "file": output_filename,
            "rows": int(len(df)),
            "feeds": len(urls),
        }
    )


if __name__ == "__main__":
    main()


