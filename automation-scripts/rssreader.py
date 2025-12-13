import os
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

import feedparser
from kestra import Kestra


def parse_rss_urls(env_value: str) -> List[str]:
    """
    Parse a comma-separated list of RSS URLs from an env var.
    """
    return [u.strip() for u in env_value.split(",") if u.strip()]


def fetch_feed_items(url: str, max_items: int = 10) -> Dict[str, Any]:
    """
    Fetch a single RSS/Atom feed and return normalized feed metadata + items.
    
    Args:
        url: The RSS/Atom feed URL to fetch
        max_items: Maximum number of items to fetch from this feed (default: 10)
    """
    feed = feedparser.parse(url)

    feed_title = getattr(feed.feed, "title", "") if hasattr(feed, "feed") else ""

    items: List[Dict[str, Any]] = []
    entries = getattr(feed, "entries", [])[:max_items]  # Limit entries
    for entry in entries:
        items.append(
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

    return {"feed_url": url, "feed_title": feed_title, "items": items}


def generate_feed_xml(feed_data: Dict[str, Any]) -> str:
    """
    Generate a basic XML-formatted string from one feed for LLM summarization.
    
    Args:
        feed_data: Dict containing feed_url, feed_title, and items list
        
    Returns:
        XML-formatted string containing feed items
    """
    root = ET.Element("feed")
    root.set("title", feed_data.get("feed_title", "") or "Unknown Feed")
    root.set("source_url", feed_data.get("feed_url", ""))

    for item in feed_data.get("items", []):
        item_elem = ET.SubElement(root, "item")

        title_elem = ET.SubElement(item_elem, "title")
        title_elem.text = item.get("item_title", "")

        link_elem = ET.SubElement(item_elem, "link")
        link_elem.text = item.get("link", "")

        published_elem = ET.SubElement(item_elem, "published")
        published_elem.text = item.get("published", "")

        summary_elem = ET.SubElement(item_elem, "summary")
        summary_elem.text = item.get("summary", "")
    
    # Convert to string with proper formatting
    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="unicode")


def main() -> None:
    # Preferred: single URL mode (used by Kestra ForEach)
    rss_url = os.environ.get("RSS_URL", "").strip()

    # Backward-compatible: comma-separated list
    rss_env = os.environ.get("RSS_URLS", "").strip()

    if not rss_url and not rss_env:
        raise ValueError(
            "Either environment variable 'RSS_URL' or 'RSS_URLS' is required and cannot be empty"
        )

    urls: List[str] = [rss_url] if rss_url else parse_rss_urls(rss_env)
    if not urls:
        raise ValueError("No valid RSS URLs found")

    # Read max items per feed from env (default: 10)
    max_items = int(os.environ.get("MAX_ITEMS_PER_FEED", "10"))

    # We expect a single URL per invocation in the new pipeline.
    # If multiple are provided, we summarize the first one to keep output stable.
    feed_url = urls[0]
    feed_data = fetch_feed_items(feed_url, max_items=max_items)
    feedxmlstring = generate_feed_xml(feed_data)

    # Expose basic metadata back to Kestra
    Kestra.outputs(
        {
            "feedUrl": feed_data.get("feed_url", ""),
            "feedTitle": feed_data.get("feed_title", ""),
            "feedxmlstring": feedxmlstring,
        }
    )


if __name__ == "__main__":
    main()


