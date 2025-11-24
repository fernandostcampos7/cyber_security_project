import bleach
import markdown as md_lib

ALLOWED_TAGS = list(bleach.sanitizer.ALLOWED_TAGS) + [
    "p",
    "img",
    "h1",
    "h2",
    "h3",
    "pre",
    "code",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "blockquote",
]

ALLOWED_ATTRS = {"img": ["src", "alt"], "a": ["href", "title"], "*": ["class"]}


def md_to_safe_html(md_text: str) -> str:
    html = md_lib.markdown(md_text or "")
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
