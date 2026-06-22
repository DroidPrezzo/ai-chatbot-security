"""Shared defense layer for the attack server.

Mirrors the sanitization performed by the Next.js `/api/chat` route so that
the "defended" attack runs reflect the same protections a real client would
get. Returns both the cleaned text and an honest assessment of whether the
attack was *blocked* (stopped before reaching the model) versus merely
*sanitized* (obfuscation stripped, benign remainder forwarded).
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

# Variation selectors + Unicode tag characters (data-smuggling carriers).
_VARIATION_SELECTORS = re.compile(r"[︀-️\U000E0100-\U000E01EF]")
_TAG_CHARS = re.compile(r"[\U000E0000-\U000E007F]")

# Zero-width / invisible characters.
_INVISIBLE = re.compile(r"[​‌‍⁠﻿­]")

# Broad emoji / pictograph / symbol ranges.
_EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E0-\U0001F1FF"
    "⌀-⏿■-◿⬀-⯿⃣]"
)

# Confusable homoglyphs → ASCII. NFKC does NOT map cross-script lookalikes
# (e.g. Cyrillic а → Latin a), so we handle the common ones explicitly.
_HOMOGLYPHS = {
    # Cyrillic lowercase
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y",
    "і": "i", "ѕ": "s", "ј": "j", "ԁ": "d", "һ": "h", "к": "k", "м": "m",
    "т": "t", "в": "b", "н": "h",
    # Greek lowercase
    "α": "a", "ε": "e", "ι": "i", "ο": "o", "ρ": "p", "υ": "u", "ν": "v",
    "χ": "x", "γ": "y", "τ": "t", "κ": "k",
    # Latin small-capital / modifier lookalikes
    "ꜱ": "s", "ʋ": "v", "ᶃ": "g",
    # Uppercase Greek/roman-numeral lookalikes
    "Ⅼ": "L", "Ι": "I", "Ο": "O", "Α": "A", "Ε": "E", "Ρ": "P", "Τ": "T",
    "Η": "H", "Κ": "K", "Μ": "M", "Ν": "N", "Β": "B", "Χ": "X", "Υ": "Y",
    "Ζ": "Z",
}
_HOMOGLYPH_RE = re.compile("[" + "".join(map(re.escape, _HOMOGLYPHS)) + "]")

# Known prompt-injection templates. A match means the payload intends to
# subvert the system prompt and is blocked outright when defense is on.
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+(instructions|prompts)", re.I),
    re.compile(r"you\s+are\s+now\s+", re.I),
    re.compile(r"act\s+as\s+(if|a)\s+", re.I),
    re.compile(r"pretend\s+(to\s+be|you\s+are)", re.I),
    re.compile(r"system\s*:\s*", re.I),
    re.compile(r"\[INST\]", re.I),
    re.compile(r"<<SYS>>", re.I),
    re.compile(r"jailbreak", re.I),
    re.compile(r"DAN\s+mode", re.I),
    re.compile(r"no\s+(restrictions|safety\s+guidelines|filter)", re.I),
    re.compile(r"reveal\s+your\s+(system\s+)?prompt", re.I),
]


@dataclass
class DefenseResult:
    sanitized: str
    threats: list[str] = field(default_factory=list)
    blocked: bool = False


def sanitize(text: str) -> DefenseResult:
    """Strip obfuscation, normalize, and detect injection intent.

    `blocked` is True when the cleaned input is empty (it was pure
    obfuscation) or a known injection template survives sanitization — in
    those cases the caller must not forward the payload to the model.
    """
    threats: list[str] = []
    cleaned = text

    if _VARIATION_SELECTORS.search(cleaned) or _TAG_CHARS.search(cleaned):
        threats.append("variation_selector_smuggling")
        cleaned = _TAG_CHARS.sub("", _VARIATION_SELECTORS.sub("", cleaned))

    if _INVISIBLE.search(cleaned):
        threats.append("invisible_character_injection")
        cleaned = _INVISIBLE.sub("", cleaned)

    if _EMOJI.search(cleaned):
        threats.append("emoji_obfuscation")
        cleaned = _EMOJI.sub("", cleaned)

    # NFKC folds math-alphanumeric and compatibility homoglyphs to ASCII.
    cleaned = unicodedata.normalize("NFKC", cleaned)

    # Explicit cross-script homoglyph folding (NFKC misses these).
    if _HOMOGLYPH_RE.search(cleaned):
        threats.append("homoglyph_substitution")
        cleaned = _HOMOGLYPH_RE.sub(lambda m: _HOMOGLYPHS[m.group()], cleaned)

    cleaned = cleaned.strip()

    blocked = False
    if not cleaned:
        # Input was entirely obfuscation/invisible characters.
        blocked = True
    else:
        for pat in _INJECTION_PATTERNS:
            if pat.search(cleaned):
                threats.append("prompt_injection_pattern")
                blocked = True
                break

    return DefenseResult(sanitized=cleaned, threats=threats, blocked=blocked)
