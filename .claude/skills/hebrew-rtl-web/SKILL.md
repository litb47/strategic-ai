---
name: hebrew-rtl-web
description: |
  Hebrew/English bilingual web content with correct RTL handling. Use when a
  page mixes Hebrew and English copy, when the user mentions "RTL", "עברית",
  "dir=rtl", "bidirectional", "Hebrew typography", "מימין לשמאל", or when
  reviewing/writing copy that includes Hebrew text. Covers: scoped `dir`
  attributes, mixed-script punctuation, Hebrew-friendly fonts, common Unicode
  pitfalls (LRM/RLM marks, smart quotes), and tone for Hebrew marketing copy.
---

# Hebrew + RTL Web

Practical rules for shipping Hebrew text on a primarily English page (or vice
versa) without layout breakage or amateur-feeling typography.

## The one rule that fixes 80% of bugs

**Scope `dir="rtl"` to the smallest element that contains Hebrew.** Never put
it on `<html>` or `<body>` if the page is mixed. Per-scene or per-paragraph
is correct.

```html
<body>
  <section class="english-scene"> ... </section>
  <section class="hebrew-scene" dir="rtl"> ... </section>
</body>
```

Putting `dir="rtl"` globally inverts ALL flexbox/grid item order, breaks
inline navigation, and makes English numbers and code samples render
backwards in subtle ways.

## Mixed-script punctuation

In Hebrew RTL paragraphs that quote English terms or numbers, the browser's
bidi algorithm usually does the right thing **as long as you don't manually
add LRM/RLM marks**. Cases where you DO need them:

- A line ending with English in parentheses, e.g. `(MCP)` — without an LRM
  before the closing `)`, the paren can flip. Add `&lrm;` only if you see
  the bug.
- A list of English acronyms in a Hebrew sentence — wrap them in `<bdi>` or
  `<span dir="ltr">` to avoid surprises.

```html
<p>הסטנדרט החדש <bdi>(Model Context Protocol)</bdi> מאפשר חיבור ישיר.</p>
```

## Quotes and dashes

- **Hebrew quotes**: use the geresh/gershayim style — `"…"` works, but typographically prefer guillemets or curly quotes consistently. Don't mix `"` and `״` in the same body of text.
- **Em dash**: `—` (U+2014) is correct in Hebrew copy too. Avoid `--`.
- **Hyphen vs maqaf**: For tightly-bound Hebrew compounds, `־` (maqaf, U+05BE) is the typographically correct connector but most projects use the regular hyphen. Be consistent.

## Numbers in Hebrew text

Numbers are **always LTR**, even inside RTL paragraphs. The bidi algorithm
handles this automatically — don't fight it. Phone numbers and prices that
break visually usually do so because of stray RLM characters; check with a
Unicode-aware text editor.

## Fonts

For Hebrew web typography, the proven options:

- **Heebo** (Google Fonts) — Modern, geometric, pairs cleanly with Inter. Good for marketing.
- **Assistant** — Very legible, slightly warmer. Good for body text.
- **Rubik** — Rounded, friendly. Good for product UI.
- **Frank Ruhl Libre** — Serif, editorial feel. Use sparingly for headlines.

Always specify a multi-script font stack:

```css
font-family: "Heebo", "Inter Tight", -apple-system, system-ui, sans-serif;
```

System defaults vary wildly across OSes for Hebrew — don't rely on `serif`
or `sans-serif` alone.

## Line height and letter spacing

Hebrew letters have less vertical variation than Latin. To compensate:

- Increase `line-height` slightly (1.55–1.7 vs Latin's 1.4–1.5).
- **Don't** apply positive `letter-spacing` to Hebrew. It breaks the visual
  rhythm of the script. If you have a global `letter-spacing` rule for
  English, scope it: `[lang="en"] { letter-spacing: 0.02em; }`.

## Marketing tone (Hebrew)

A few patterns that distinguish polished Hebrew copy from machine-translated:

- **Avoid passive constructions** that sound natural in English but stiff in Hebrew. "המערכת מנוהלת על ידי X" → "X מנהל את המערכת".
- **Mid-sentence English terms** read better with a thin space or with em-tags for emphasis: `שלב של <em>"חשיבה לפני פעולה"</em>`.
- **Avoid loanword overload**. "אורקסטרציה" and "סקיילבילי" feel jargon-heavy. Prefer Hebrew where it doesn't sound forced; keep English when the term is genuinely industry-standard (MCP, Agent, LangGraph).
- **Headlines** in Hebrew tend to be shorter than English equivalents. If your designer left a 6-word slot for an English headline, the Hebrew translation will probably need 4 words to feel as punchy. Don't pad to fill the box.

## Common bugs and their fixes

| Symptom | Cause | Fix |
|---|---|---|
| Punctuation jumps to wrong end of line | Trailing whitespace + Latin char in RTL block | Trim whitespace; wrap Latin in `<bdi>` |
| Number renders as `123` reversed | Stray RLM / explicit LTR override applied | Remove the override — bidi handles numbers automatically |
| Flex items in wrong order on Hebrew section | `dir="rtl"` applied at body level | Move `dir="rtl"` to the section |
| Hebrew text looks "thin" / spread out | `letter-spacing > 0` applied globally | Scope letter-spacing to `[lang="en"]` |
| Mixed quotes (`"…"` and `״…״`) in same paragraph | Editor auto-substituted some | Pick one style, do a find-replace pass |
| `<em>` / italic Hebrew looks wrong | Most Hebrew fonts have no real italic; browser fakes it via skew | Use `font-weight` or color for emphasis instead, or ship a font that has a true italic cut |

## Project-specific notes (Strategic_AI)

This project alternates LTR English (Hero, Closing) and RTL Hebrew scenes
(Exec Summary, Nexus, Pillars, Bio). The current pattern in
`AI Evolution 2026.html` is correct: `dir="rtl"` lives on each Hebrew
`.scene` root, not at body level. Maintain that.

The font stack already includes Heebo and Inter Tight; no changes needed
for typography. When adding new Hebrew copy:

1. Add `dir="rtl"` to the new scene root if it's Hebrew-dominant.
2. Wrap inline English terms (MCP, LangGraph, etc.) in `<span class="pt-en">` or `<bdi>` if you see bidi glitches.
3. Don't manually insert RLM/LRM marks unless you've reproduced a bug without them.
