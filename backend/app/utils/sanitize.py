from __future__ import annotations

import markdown
from bleach import clean
from bleach.sanitizer import ALLOWED_ATTRIBUTES, ALLOWED_TAGS

ALLOWED_TAGS_EXTENDED = list(ALLOWED_TAGS) + ["p", "pre", "code", "img", "h1", "h2", "h3"]
ALLOWED_ATTRIBUTES_EXTENDED = {**ALLOWED_ATTRIBUTES, "img": ["src", "alt", "title"]}


def markdown_to_html(md: str) -> str:
    html = markdown.markdown(md, extensions=["extra", "sane_lists"])
    return clean(html, tags=ALLOWED_TAGS_EXTENDED, attributes=ALLOWED_ATTRIBUTES_EXTENDED)


__all__ = ["markdown_to_html"]
