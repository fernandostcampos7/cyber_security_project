from bleach.callbacks import nofollow, target_blank
import bleach
import markdown as md

# Reasonable safe defaults for product reviews
ALLOWED_TAGS: list[str] = [
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "a",
    "code",
    "pre",
]
ALLOWED_ATTRS: dict[str, list[str]] = {
    "a": ["href", "title"],
}

ALLOWED_PROTOCOLS: list[str] = ["http", "https", "mailto"]


def md_to_safe_html(text: str) -> str:
    """
    Convert Markdown to HTML and sanitise for safe rendering.
    """
    raw_html = md.markdown(text, extensions=["extra", "sane_lists"])
    cleaned = bleach.clean(
        raw_html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
    # Make all links nofollow noopener
    cleaned = bleach.linkify(
        cleaned,
        callbacks=[nofollow, target_blank],
    )

    return cleaned
