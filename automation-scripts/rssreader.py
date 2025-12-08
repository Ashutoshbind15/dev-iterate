import os
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

import pandas as pd
import feedparser
from kestra import Kestra


def parse_rss_urls(env_value: str) -> List[str]:
    """
    Parse a comma-separated list of RSS URLs from an env var.
    """
    return [u.strip() for u in env_value.split(",") if u.strip()]


def fetch_feed_items(url: str, max_items: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch a single RSS/Atom feed and return a list of normalized item dicts.
    
    Args:
        url: The RSS/Atom feed URL to fetch
        max_items: Maximum number of items to fetch from this feed (default: 10)
    """
    feed = feedparser.parse(url)

    feed_title = getattr(feed.feed, "title", "") if hasattr(feed, "feed") else ""

    rows: List[Dict[str, Any]] = []
    entries = getattr(feed, "entries", [])[:max_items]  # Limit entries
    for entry in entries:
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


def generate_feed_xml(all_rows: List[Dict[str, Any]]) -> str:
    """
    Generate a basic XML-formatted string from feed items for LLM summarization.
    
    Args:
        all_rows: List of feed item dictionaries
        
    Returns:
        XML-formatted string containing all feed items
    """
    root = ET.Element("feeds")
    
    # Group items by feed_title for better structure
    feeds_dict: Dict[str, List[Dict[str, Any]]] = {}
    for row in all_rows:
        feed_title = row.get("feed_title", "Unknown Feed")
        if feed_title not in feeds_dict:
            feeds_dict[feed_title] = []
        feeds_dict[feed_title].append(row)
    
    for feed_title, items in feeds_dict.items():
        feed_elem = ET.SubElement(root, "feed")
        feed_elem.set("title", feed_title)
        feed_elem.set("source_url", items[0].get("source_url", ""))
        
        for item in items:
            item_elem = ET.SubElement(feed_elem, "item")
            
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
    # Read comma-separated RSS URLs from env
    rss_env = os.environ.get("RSS_URLS", "")
    if not rss_env.strip():
        raise ValueError("Environment variable 'RSS_URLS' is required and cannot be empty")

    urls = parse_rss_urls(rss_env)
    if not urls:
        raise ValueError("No valid RSS URLs found in 'RSS_URLS'")

    # Read max items per feed from env (default: 10)
    max_items = int(os.environ.get("MAX_ITEMS_PER_FEED", "10"))

    # Fetch all feeds and flatten into a single list of rows
    all_rows: List[Dict[str, Any]] = []
    for url in urls:
        all_rows.extend(fetch_feed_items(url, max_items=max_items))

    # Build DataFrame and write to CSV
    df = pd.DataFrame(all_rows)

    output_filename = os.environ.get("FILENAME", "rss_feeds.csv")
    df.to_csv(output_filename, index=False)

    # Generate XML string for LLM summarization
    feedxmlstring = generate_feed_xml(all_rows)

    # Expose basic metadata back to Kestra
    Kestra.outputs(
        {
            "file": output_filename,
            "rows": int(len(df)),
            "feeds": len(urls),
            "feedxmlstring": feedxmlstring,
        }
    )


if __name__ == "__main__":
    main()


