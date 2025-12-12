#!/usr/bin/env python3
"""
Convert TipTap/ProseMirror JSON (doc) into Markdown.

Supports the node types used by `kestra/flows/lesson_content_generator.yml`:
- heading (attrs.level)
- paragraph (empty or with text)
- bulletList / orderedList (listItem -> paragraph)
- codeBlock (attrs.language)
- blockquote
- horizontalRule

Inline marks supported on text nodes:
- bold -> **text**
- italic -> *text*
- code -> `text`

No third-party dependencies.

Examples:
  cat lesson.json | python automation-scripts/tiptap_to_markdown.py > lesson.md
  python automation-scripts/tiptap_to_markdown.py --json "$(cat lesson.json)" --out lesson.md
  DOC_JSON="$(cat lesson.json)" python automation-scripts/tiptap_to_markdown.py --from-env DOC_JSON --out lesson.md
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional, Sequence, Tuple


def _ensure_list(x: Any) -> List[Any]:
    return x if isinstance(x, list) else []


def _md_escape_text(text: str) -> str:
    # Keep it conservative: do not aggressively escape punctuation.
    # We only normalize line breaks for Markdown paragraphs.
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _escape_inline_code(text: str) -> str:
    # Minimal inline-code escaping: avoid breaking the fence.
    # Use single backticks and replace backticks inside.
    return text.replace("`", "\\`")


def _apply_marks(text: str, marks: Optional[Sequence[Dict[str, Any]]]) -> str:
    marks = marks or []
    # Normalize order so output is stable.
    mark_types = [m.get("type") for m in marks if isinstance(m, dict)]

    out = text

    # Inline code first, since it changes escaping rules.
    if "code" in mark_types:
        out = f"`{_escape_inline_code(out)}`"

    if "bold" in mark_types:
        out = f"**{out}**"

    if "italic" in mark_types:
        out = f"*{out}*"

    return out


def _render_inline(node: Dict[str, Any]) -> str:
    t = node.get("type")
    if t != "text":
        return ""
    text = _md_escape_text(str(node.get("text", "")))
    return _apply_marks(text, node.get("marks"))


def _join_paragraph_inlines(inlines: List[Dict[str, Any]]) -> str:
    raw = "".join(_render_inline(n) for n in inlines)
    # If the model emitted literal newlines inside paragraph text, map them to markdown hard line breaks.
    if "\n" in raw:
        raw = "  \n".join(raw.split("\n"))
    return raw


def _trim_trailing_blank_lines(lines: List[str]) -> List[str]:
    while lines and lines[-1].strip() == "":
        lines.pop()
    return lines


def _prefix_lines(lines: List[str], prefix: str) -> List[str]:
    if not lines:
        return [prefix.rstrip()]
    return [f"{prefix}{line}" if line != "" else prefix.rstrip() for line in lines]


def render_markdown(doc: Dict[str, Any]) -> str:
    """
    Render a TipTap/ProseMirror 'doc' JSON object to Markdown.
    """
    if not isinstance(doc, dict) or doc.get("type") != "doc":
        raise ValueError("Input must be a JSON object with { type: 'doc', content: [...] }")

    lines = _render_blocks(_ensure_list(doc.get("content")), indent_level=0)
    lines = _trim_trailing_blank_lines(lines)
    return "\n".join(lines) + ("\n" if lines else "")


def _render_blocks(nodes: List[Any], indent_level: int) -> List[str]:
    out: List[str] = []
    for node in nodes:
        if not isinstance(node, dict):
            continue
        rendered = _render_block(node, indent_level=indent_level)
        out.extend(rendered)
    return out


def _render_block(node: Dict[str, Any], indent_level: int) -> List[str]:
    t = node.get("type")

    if t == "heading":
        level = int(node.get("attrs", {}).get("level", 1) or 1)
        level = min(max(level, 1), 6)
        text = _join_paragraph_inlines(_ensure_list(node.get("content")))
        return [f"{'#' * level} {text}".rstrip(), ""]

    if t == "paragraph":
        content = node.get("content")
        if not isinstance(content, list) or len(content) == 0:
            return [""]  # keep blank line
        text = _join_paragraph_inlines(content)
        return [text.rstrip(), ""]

    if t == "horizontalRule":
        return ["---", ""]

    if t == "codeBlock":
        language = str(node.get("attrs", {}).get("language", "") or "").strip()
        text_nodes = _ensure_list(node.get("content"))
        code_text = ""
        if text_nodes and isinstance(text_nodes[0], dict) and text_nodes[0].get("type") == "text":
            code_text = str(text_nodes[0].get("text", ""))
        code_text = code_text.replace("\r\n", "\n").replace("\r", "\n")
        fence = "```"
        return [f"{fence}{language}".rstrip(), code_text.rstrip("\n"), fence, ""]

    if t == "blockquote":
        inner = _render_blocks(_ensure_list(node.get("content")), indent_level=indent_level)
        inner = _trim_trailing_blank_lines(inner)
        # Prefix every line; blank lines become just ">".
        return _prefix_lines(inner if inner else [""], "> ") + [""]

    if t == "bulletList":
        return _render_list(node, ordered=False, indent_level=indent_level)

    if t == "orderedList":
        return _render_list(node, ordered=True, indent_level=indent_level)

    # Unknown node type: ignore safely.
    return []


def _render_list(node: Dict[str, Any], ordered: bool, indent_level: int) -> List[str]:
    items = _ensure_list(node.get("content"))
    start = 1
    if ordered:
        start = int(node.get("attrs", {}).get("start", 1) or 1)
        if start < 1:
            start = 1

    out: List[str] = []
    index = 0
    for item in items:
        if not isinstance(item, dict) or item.get("type") != "listItem":
            continue

        prefix = f"{start + index}. " if ordered else "- "
        index += 1

        item_blocks = _ensure_list(item.get("content"))
        # Render item blocks with increased indent, then "hang" them under the bullet/number.
        rendered_item = _render_blocks(item_blocks, indent_level=indent_level + 1)
        rendered_item = _trim_trailing_blank_lines(rendered_item)

        base_indent = "  " * indent_level
        hang_indent = "  " * (indent_level + 1)

        if not rendered_item:
            out.append(f"{base_indent}{prefix}".rstrip())
            continue

        # First non-empty line goes on the same line as the bullet; subsequent lines are indented.
        first_line_used = False
        for line in rendered_item:
            if not first_line_used and line.strip() != "":
                out.append(f"{base_indent}{prefix}{line}".rstrip())
                first_line_used = True
            else:
                out.append(f"{hang_indent}{line}".rstrip() if line != "" else hang_indent.rstrip())

    out.append("")
    return out


def _read_json(*, json_str: Optional[str], from_env: Optional[str]) -> Any:
    if json_str is not None:
        return json.loads(json_str)
    if from_env:
        if from_env not in os.environ:
            raise ValueError(f"Environment variable not set: {from_env}")
        return json.loads(os.environ[from_env])
    return json.load(sys.stdin)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert TipTap/ProseMirror JSON to Markdown")
    src = parser.add_mutually_exclusive_group()
    src.add_argument("--json", dest="json_str", default=None, help="Input JSON string (default: stdin)")
    src.add_argument("--from-env", dest="from_env", default=None, help="Read input JSON string from an env var (default: stdin)")
    parser.add_argument("--out", dest="out_path", default=None, help="Output Markdown file (default: stdout)")
    args = parser.parse_args()

    data = _read_json(json_str=args.json_str, from_env=args.from_env)

    # Accept either the doc directly or a wrapper with { content: doc } etc.
    doc = data
    if isinstance(data, dict) and data.get("type") != "doc":
        # Common wrappers: { doc: {...} } or { content: {...} }
        for key in ("doc", "content", "jsonOutput"):
            if isinstance(data.get(key), dict) and data[key].get("type") == "doc":
                doc = data[key]
                break

    md = render_markdown(doc)

    if args.out_path:
        with open(args.out_path, "w", encoding="utf-8") as f:
            f.write(md)
    else:
        sys.stdout.write(md)


if __name__ == "__main__":
    main()


