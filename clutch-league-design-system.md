# Clutch League — Frontend Source of Truth

> Dark, gaming-inspired identity for a live amateur football league (Prague, 7 v 7). Czech UI copy, *tykání*. Every value below is final; do not round, substitute or invent.

## 0. Hard Rules

- Page background is true black `#000000`. Never grey.
- Colour ratio per screen: ~70 % dark · ~22 % white/silver · **max ~8 % gold**.
- **Chamfers, not border-radius.** 45° cut on top-left + bottom-right via `clip-path`. `border-radius` only on status dots (`999px`).
- **No grey drop shadows.** Depth = 1px hairlines + gold light. Gold glow on **one** element per screen (usually the hero CTA).
- Red `#FF2D16` is reserved for **LIVE** only.
- Gold text only for: the LEAGUE-style overline, one key figure per block, inline links. Never one gold word inside a headline.
- Light rays: **once**, on the home hero only.
- Halftone raster is a background layer, never under body copy.
- Banned: purple/blue gradients, neon cyan/pink, rainbow, glassmorphism / backdrop blur, Inter, Roboto, emoji, "→" after every button, scroll-in reveal animations.
- Because `clip-path` removes `border` and `box-shadow`, outlined chamfered shapes are built as: **outer element fill = outline colour**, **inner layer (`::before` or child) inset 1px = surface fill**. Glow on chamfered shapes = `filter: drop-shadow()` on a **wrapper** element.

## 1. Global Design Tokens

### 1.1 Fonts (Google Fonts)

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,700&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap">
```

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / headings ("CLUTCH") | Chakra Petch | 700 italic | uppercase, lh 0.92–1.05 |
| Overline ("LEAGUE") | Chakra Petch | 600 | uppercase, letter-spacing 0.34em, gold |
| Labels, nav, buttons | Chakra Petch | 600–700 | uppercase, letter-spacing 0.16em |
| Numbers (scores, stats, tables) | Chakra Petch | 500–700 | `font-variant-numeric: tabular-nums` |
| Body | Barlow | 400 / 500 / 600 | sentence case |

Both families cover Czech diacritics (ř ě ů ď ň ť ž č š ý á í é).

```css
/* Clutch League — webfonts. Google Fonts only (brief §4), max 2 families.
   Chakra Petch = logo voice: wide, technical, chamfered terminals, tabular figures.
   Barlow = body voice: sporty grotesk, full Czech diacritics (ř ě ů ď ň ť).
   No Inter, no Roboto. */
:root{
  --font-display:"Chakra Petch","Arial Narrow",system-ui,sans-serif;
  --font-body:"Barlow","Helvetica Neue",system-ui,sans-serif;
  --font-numeric:"Chakra Petch","Arial Narrow",system-ui,sans-serif;
}
```

### 1.2 Colors

| Group | Token | HEX | RGB | Use |
|---|---|---|---|---|
| Background | `--black` | #000000 | 0,0,0 | page |
| Background | `--bg-inset` | #0A0A0A | 10,10,10 | input fill, crest |
| Surface | `--surface` | #141414 | 20,20,20 | cards, panels, tables |
| Surface | `--surface-2` | #1C1C1C | 28,28,28 | raised / row hover (#1A1A1A) |
| Surface | `--surface-3` | #242424 | 36,36,36 | rare |
| Line | `--line` | #2A2A2A | 42,42,42 | default hairline, dividers |
| Line | `--line-strong` | #3D3D3D | 61,61,61 | checkbox outline, neutral badge |
| Primary (accent) | `--gold` | #F5B300 | 245,179,0 | primary button, active states, key numbers |
| Primary hover | `--gold-hot` | #FFD34D | 255,211,77 | hover, glow, links, focus ring |
| Primary press | `--gold-deep` | #C77A00 | 199,122,0 | pressed, gradient end, primary outline |
| Secondary (text/outline) | `--white` | #F2F2F0 | 242,242,240 | headings, secondary button outline (85 % alpha) |
| Text body | `--text-body` | #DCDCDA | 220,220,218 | paragraphs |
| Text muted | `--silver` | #A6A6A6 | 166,166,166 | secondary text, captions |
| Text faint | `--silver-dim` | #6E6E6E | 110,110,110 | meta ≥13px, placeholders, table heads |
| Live | `--live` | #FF2D16 | 255,45,22 | LIVE badge only |
| Success / win | `--win` | #B7D43C | 183,212,60 | result "V" |
| Draw | `--draw` | #A6A6A6 | 166,166,166 | result "R" |
| Loss | `--loss` | #6E6E6E | 110,110,110 | result "P" |
| Error | `--danger` | #FF5A3C | 255,90,60 | form errors, destructive outline |
| Warning | `--warning` | #F5B300 | 245,179,0 | = gold |
| On accent | `--text-on-accent` | #0A0A0A | 10,10,10 | text on gold |

Contrast (WCAG): white/#000 15.9:1 · white/#141414 14.7:1 · silver/#141414 7.9:1 · gold/#000 ≈10.9:1 · #0A0A0A/gold ≈10.5:1 · white/live ≈3.7:1 (bold/large only) · silver-dim/#000 ≈4.1:1 (meta only, ≥13px).

```css
/* Clutch League — color. Everything derived from the logo: true black field,
   concrete white type, one gold light source. Ratio target: ~70% dark / ~22% white+silver / max ~8% gold. */
:root{
  /* base palette */
  --black:#000000;
  --surface:#141414;
  --surface-2:#1C1C1C;
  --surface-3:#242424;
  --line:#2A2A2A;
  --line-strong:#3D3D3D;
  --gold:#F5B300;
  --gold-hot:#FFD34D;
  --gold-deep:#C77A00;
  --white:#F2F2F0;
  --silver:#A6A6A6;
  --silver-dim:#6E6E6E;

  /* state — tuned warm so nothing fights the gold */
  --live:#FF2D16;          /* red is reserved for LIVE, nothing else */
  --win:#B7D43C;           /* olive-lime, warm side of green */
  --draw:#A6A6A6;
  --loss:#6E6E6E;
  --danger:#FF5A3C;
  --warning:#F5B300;

  /* semantic aliases — use these in product code */
  --bg-page:var(--black);
  --bg-elevated:var(--surface);
  --bg-elevated-2:var(--surface-2);
  --bg-inset:#0A0A0A;
  --bg-accent:var(--gold);
  --bg-accent-hover:var(--gold-hot);
  --bg-accent-press:var(--gold-deep);

  --text-heading:var(--white);
  --text-body:#DCDCDA;
  --text-muted:var(--silver);
  --text-faint:var(--silver-dim);
  --text-accent:var(--gold);          /* text only: numbers, labels, one KPI */
  --text-on-accent:#0A0A0A;           /* black type on gold — 11.9:1 */
  --text-link:var(--gold-hot);
  --text-link-hover:var(--white);

  --border-subtle:var(--line);
  --border-strong:var(--line-strong);
  --border-white:rgba(242,242,240,.85);
  --border-accent:var(--gold);
  --focus-ring:var(--gold-hot);
}
```

### 1.3 Typography

Scale — clamp(min mobile, fluid, max desktop):

| Token | Desktop | Mobile | Family / weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| `--fs-display-1` | 104px | 44px | Chakra Petch 700 italic, UPPER | 0.92 | -0.01em |
| `--fs-display-2` | 72px | 36px | Chakra Petch 700 italic, UPPER | 0.92 | -0.01em |
| H1 `--fs-h1` | 56px | 32px | Chakra Petch 700 italic, UPPER | 0.92 | -0.01em |
| H2 `--fs-h2` | 40px | 26px | Chakra Petch 700 italic, UPPER | 1.05 | -0.01em |
| H3 `--fs-h3` | 30px | 22px | Chakra Petch 700 italic, UPPER | 1.05 | -0.01em |
| H4 `--fs-h4` | 20px | 20px | Chakra Petch 700, UPPER | 1.05 | 0.005em |
| H5 `--fs-h5` | 17px | 17px | Chakra Petch 700, UPPER | 1.25 | 0.005em |
| H6 `--fs-h6` | 15px | 15px | Chakra Petch 600–700, UPPER | 1.25 | 0.16em |
| Body L `--fs-body-lg` | 19px | 19px | Barlow 400 | 1.55 | 0 |
| Body `--fs-body` | 17px | 17px | Barlow 400 | 1.55 | 0 |
| Body S `--fs-body-sm` | 15px | 15px | Barlow 400 | 1.45–1.55 | 0 |
| Caption `--fs-caption` | 13px | 13px | Barlow 400 / Chakra 600 (overline) | 1.4 | 0 / 0.34em |
| Micro `--fs-micro` | 11px | 11px | Chakra Petch 600–700, UPPER | 1 | 0.16em |
| Score `--fs-score` | 64px | 32px | Chakra Petch 700, tnum | 1 | 0 |
| Stat `--fs-stat` | 26px | 26px | Chakra Petch 700, tnum | 1 | 0 |

Clamp formulas: display-1 `clamp(44px,8.5vw,104px)` · display-2 `clamp(36px,6vw,72px)` · h1 `clamp(32px,4.4vw,56px)` · h2 `clamp(26px,3.2vw,40px)` · h3 `clamp(22px,2.4vw,30px)` · score `clamp(32px,5vw,64px)`.

Overline pattern: `[2px gold rule, flex:1] — TEXT (Chakra 600, 0.34em, gold) — [2px gold rule, flex:1]`, max 2 per page.

Score pattern: `3<span colon>:</span>2` — colon gold, 0.6em, translateY(-0.15em).

```css
/* Clutch League — type. Two families, three voices.
   display = "CLUTCH" (wide, heavy, tight), overline = "LEAGUE" (stretched, gold, rare), body = Barlow. */
:root{
  --fs-display-1:clamp(44px,8.5vw,104px); /* @kind font */
  --fs-display-2:clamp(36px,6vw,72px); /* @kind font */
  --fs-h1:clamp(32px,4.4vw,56px); /* @kind font */
  --fs-h2:clamp(26px,3.2vw,40px); /* @kind font */
  --fs-h3:clamp(22px,2.4vw,30px); /* @kind font */
  --fs-h4:20px; /* @kind font */
  --fs-h5:17px; /* @kind font */
  --fs-h6:15px; /* @kind font */
  --fs-body-lg:19px; /* @kind font */
  --fs-body:17px; /* @kind font */
  --fs-body-sm:15px; /* @kind font */
  --fs-caption:13px; /* @kind font */
  --fs-micro:11px; /* @kind font */
  --fs-score:clamp(32px,5vw,64px); /* @kind font */
  --fs-stat:26px; /* @kind font */

  --lh-display:0.92; /* @kind font */
  --lh-heading:1.05; /* @kind font */
  --lh-snug:1.25; /* @kind font */
  --lh-body:1.55; /* @kind font */

  --ls-display:-0.01em; /* @kind font */
  --ls-heading:0.005em; /* @kind font */
  --ls-overline:0.34em; /* @kind font */   /* the "LEAGUE" stretch */
  --ls-label:0.16em; /* @kind font */
  --ls-body:0; /* @kind font */

  --fw-body:400; /* @kind font */
  --fw-medium:500; /* @kind font */
  --fw-semibold:600; /* @kind font */
  --fw-display:700; /* @kind font */

  --display-skew:-6deg; /* @kind other */   /* logo wordmark leans forward */
}
```

### 1.4 Spacing & Sizing

Base 4px. Scale: 0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128.

```css
/* Clutch League — spacing. 4px base, stadium-scale jumps at the top end. */
:root{
  --sp-0:0; /* @kind spacing */
  --sp-1:4px;
  --sp-2:8px;
  --sp-3:12px;
  --sp-4:16px;
  --sp-5:20px;
  --sp-6:24px;
  --sp-8:32px;
  --sp-10:40px;
  --sp-12:48px;
  --sp-16:64px;
  --sp-20:80px;
  --sp-24:96px;
  --sp-32:128px;

  --section-y:clamp(64px,9vw,128px); /* @kind spacing */
  --gutter:clamp(20px,5vw,48px); /* @kind spacing */
  --container:1240px;
  --container-narrow:760px;
  --grid-gap:24px;

  --control-h-sm:34px;
  --control-h-md:44px;
  --control-h-lg:54px;
}
```

### 1.5 Corners (chamfers) & Borders

No border-radius. Chamfer = size of the 45° cut on top-left and bottom-right corners.

| Token | Value | Used by |
|---|---|---|
| `--chamfer-sm` | 6px | crests, small icon button |
| `--chamfer-md` | 12px | cards, panels (default) |
| `--chamfer-lg` | 20px | rule cards |
| `--chamfer-xl` | 32px | hero panels |
| `--chamfer-btn` | 10px | button md |
| `--chamfer-btn-sm` | 7px | button sm |
| `--chamfer-btn-lg` | 14px | button lg |
| `--chamfer-iconbtn` | 8px | icon button md |
| `--chamfer-iconbtn-sm` | 6px | icon button sm |
| `--chamfer-badge` | 5px | badge |
| `--chamfer-input` | 8px | input / select / textarea |
| checkbox | 5px outer / 4px inner | checkbox box |
| `--radius-pill` | 999px | status dots only |

Outer clip-path (cut `c`):
```css
clip-path: polygon(c 0, 100% 0, 100% calc(100% - c), calc(100% - c) 100%, 0 100%, 0 c);
```
Inner layer (inset 1px) clip-path:
```css
clip-path: polygon(calc(c - 1px) 0, 100% 0, 100% calc(100% - c + 1px), calc(100% - c + 1px) 100%, 0 100%, 0 calc(c - 1px));
```
All-corner variant (`.cl-chamfer-all`) cuts all four corners.

Borders: 1px (default) or 2px (nav active rule, overline rules, table highlight). Colours: `--line` default · `rgba(242,242,240,.85)` white · `--gold` emphasis/hover.

```css
/* Clutch League — shape. Chamfers, not radii. The cut comes from the logo lettering
   and the fanned cards: a 45° slice off opposing corners. */
:root{
  --chamfer-sm:6px;
  --chamfer-md:12px;
  --chamfer-lg:20px;
  --chamfer-xl:32px;

  /* per-component cuts */
  --chamfer-btn:10px;
  --chamfer-btn-sm:7px;
  --chamfer-btn-lg:14px;
  --chamfer-iconbtn:8px;
  --chamfer-iconbtn-sm:6px;
  --chamfer-badge:5px;
  --chamfer-input:8px;

  --radius-none:0;
  --radius-pill:999px;   /* only for status dots and avatars */

  --border-1:1px; /* @kind other */
  --border-2:2px; /* @kind other */
}
```

### 1.6 Shadows, Glow & Texture

There are **no neutral shadows**. Only gold light:

| Token | CSS |
|---|---|
| `--glow-gold-sm` | `0 0 12px rgba(245,179,0,.35)` |
| `--glow-gold` | `0 0 0 1px rgba(245,179,0,.5), 0 0 24px rgba(245,179,0,.28), 0 0 64px rgba(245,179,0,.12)` |
| `--glow-gold-lg` | `0 0 0 1px rgba(255,211,77,.6), 0 0 40px rgba(245,179,0,.4), 0 0 120px rgba(199,122,0,.25)` |
| `--glow-drop` (for chamfered elements, on wrapper) | `drop-shadow(0 0 10px rgba(245,179,0,.5)) drop-shadow(0 0 32px rgba(245,179,0,.28))` |
| `--glow-live` | `0 0 16px rgba(255,45,22,.45)` |
| `--glow-inset-gold` | `inset 0 0 0 1px rgba(245,179,0,.35), inset 0 -24px 40px -24px rgba(245,179,0,.25)` |

Gradients: `--sheen-gold` `linear-gradient(180deg,#FFD34D,#F5B300 45%,#C77A00)` (primary button fill) · `--ray-gold` (1px light ray) · `--scrim-photo` `linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.85))` (text over photos) · hero backdrop `radial-gradient(60% 55% at 50% 42%,#1a1204,#000 70%)`.

Halftone: `radial-gradient(rgba(245,179,0,.5) 1px,transparent 1.4px)` at `7px 7px`, always masked (fade to transparent). Grain (big white display only): dot pattern clipped into the text via `background-clip:text`.

```css
/* Clutch League — light, texture, depth. No grey drop shadows anywhere:
   depth is made by gold light and by one-pixel lines. */
:root{
  --glow-gold-sm:0 0 12px rgba(245,179,0,.35);
  --glow-gold:0 0 0 1px rgba(245,179,0,.5),0 0 24px rgba(245,179,0,.28),0 0 64px rgba(245,179,0,.12);
  --glow-gold-lg:0 0 0 1px rgba(255,211,77,.6),0 0 40px rgba(245,179,0,.4),0 0 120px rgba(199,122,0,.25);
  --glow-drop:drop-shadow(0 0 10px rgba(245,179,0,.5)) drop-shadow(0 0 32px rgba(245,179,0,.28)); /* @kind other */ /* use on clip-path (chamfered) elements via a wrapper */
  --glow-live:0 0 16px rgba(255,45,22,.45);
  --glow-inset-gold:inset 0 0 0 1px rgba(245,179,0,.35),inset 0 -24px 40px -24px rgba(245,179,0,.25);

  --ray-gold:linear-gradient(90deg,transparent,rgba(245,179,0,0) 8%,rgba(245,179,0,.85) 48%,rgba(255,211,77,1) 60%,transparent 100%); /* @kind other */
  --sheen-gold:linear-gradient(180deg,#FFD34D,#F5B300 45%,#C77A00); /* @kind other */
  --fade-bottom:linear-gradient(180deg,transparent,rgba(0,0,0,.92) 72%,#000); /* @kind other */
  --fade-top:linear-gradient(0deg,transparent,rgba(0,0,0,.9)); /* @kind other */
  --scrim-photo:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.85)); /* @kind other */

  /* halftone raster from the logo background — a layer, never under text */
  --halftone:radial-gradient(rgba(245,179,0,.5) 1px,transparent 1.4px); /* @kind other */
  --halftone-size:7px 7px; /* @kind other */
  --grain-opacity:.16; /* @kind other */

  --overlay-hover:rgba(242,242,240,.06); /* @kind other */
  --overlay-press:rgba(0,0,0,.35); /* @kind other */
}
```

## 2. Core Components & States

Global control transition: `--t-control` = bg/color/border 140ms, box-shadow 220ms, transform 80ms, all `cubic-bezier(.2,.8,.3,1)`.
Global focus: `:focus-visible { outline: 2px solid #FFD34D; outline-offset: 2px }`.

### 2.1 Button

Base: `inline-flex`, centre, gap 8px, Chakra Petch 700, uppercase, letter-spacing 0.16em, `white-space:nowrap`, no border, chamfer cut per size. Outline layer = element background; fill = `::before` inset 1px.

| Size | Height | Padding (x) | Font size | Chamfer | Icon |
|---|---|---|---|---|---|
| sm | 34px | 16px | 13px | 7px | 14px |
| md | 44px | 24px | 15px | 10px | 16px |
| lg | 54px | 32px | 17px | 14px | 20px |

Variants:

- **Primary** (max 1 per view) — outline `#C77A00`, fill `--sheen-gold`, text `#0A0A0A`.
  - Hover: fill `linear-gradient(180deg,#FFE08A,#FFD34D 50%,#F5B300)`.
  - Active: fill `linear-gradient(180deg,#F5B300,#C77A00)`, `translateY(1px)`.
  - `glow` prop (hero CTA only): wrapper with `filter: var(--glow-drop)`.
- **Secondary** — outline `rgba(242,242,240,.85)`, fill `#000`, text `#F2F2F0`.
  - Hover: outline `#F5B300`, fill `#0E0E0E`, text `#FFD34D`.
  - Active: fill `#080808`, `translateY(1px)`.
- **Ghost** — no outline, transparent fill, text `#A6A6A6`.
  - Hover: text `#F2F2F0`, fill `rgba(242,242,240,.06)`.
  - Active: fill `rgba(0,0,0,.35)`.
- **Danger** — outline `#FF5A3C`, fill `#140604`, text `#FF5A3C`. Hover fill `#240905`.
- **Disabled** (all): outline `#2A2A2A`, fill `#101010`, text `#6E6E6E`, `pointer-events:none`, no glow.
- **Loading**: disabled + label opacity 0.45.
- **Block**: `display:flex; width:100%`.

Copy: label = exact action ("Přihlásit tým", "Rozpis zápasů"). No trailing arrow.

### 2.2 Icon Button

Square, md 44×44 (chamfer 8px) / sm 34×34 (chamfer 6px). Outline `#2A2A2A`, fill `#141414`, icon `#A6A6A6`, 20px.
- Hover: outline `#F5B300`, icon `#FFD34D`.
- Active: `translateY(1px)`.
- Bare (nav, over imagery): no outline/fill; hover icon `#F5B300`.
- Always has `aria-label`.

### 2.3 Inputs (Field, Select, Textarea)

- Stack: label → control → hint, gap 8px.
- Label: Chakra Petch 600, 11px, uppercase, letter-spacing 0.16em, `#A6A6A6`.
- Wrapper: outline fill `#2A2A2A`, chamfer 8px.
- Control: height 44px, margin 1px (the outline), padding 0 16px, Barlow 17px, text `#F2F2F0`, fill `#0A0A0A`, inner chamfer 7px, no border, no outline.
- Placeholder: `#6E6E6E`.
- Textarea: min-height 104px, padding 12px 16px, lh 1.55, vertical resize.
- Select: `appearance:none`, padding-right 40px, gold chevron icon 14px at right 14px.
- Hint: Barlow 13px `#6E6E6E`.
- **Focus** (`:focus-within`): outline `#F5B300`.
- **Error**: outline `#FF5A3C`, hint replaced by error text in `#FF5A3C`. Copy: "Nepovedlo se. Chybí jméno kapitána."
- **Disabled**: text `#6E6E6E`, no focus change.

### 2.4 Checkbox

- Box 20×20, margin-top 1px, outer `#3D3D3D` chamfer 5px, inner fill `#0A0A0A` chamfer 4px.
- Label: Barlow 15px `#DCDCDA`, lh 1.4, gap 12px.
- Hover: outer `#C77A00`.
- Checked: outer `#F5B300`, inner `--sheen-gold`, check icon 13px `#0A0A0A`.
- Focus-visible: `box-shadow: 0 0 0 2px #FFD34D`.

### 2.5 Card / Panel

- Outer fill = outline colour, chamfer 12px (default); inner fill `#141414` inset 1px.
- Body padding 24px (override per use: 0 for tables/lists).
- Outline variants: subtle `#2A2A2A` (default) · white `rgba(242,242,240,.85)` · gold `#F5B300` · flat (`#2A2A2A` line on `#000` fill).
- Raster: halftone layer, opacity 0.5, masked `radial-gradient(120% 80% at 50% 0,#000,transparent 70%)`.
- Number notch (real sequences only): top-left, gold fill, text `#0A0A0A` Chakra 700 17px tnum, padding 4px 18px 10px 10px, clip `polygon(0 0,100% 0,72% 100%,0 100%)`.
- **Interactive** hover: outline → `#F5B300` (220ms). Active: `translateY(1px)`.
- **Glow** (1 per screen): outline `#FFD34D` + wrapper `filter: var(--glow-drop)`.
- Never a drop shadow, never a coloured left-border-only card.

### 2.6 Rule Card (brand artefact)

- Aspect ratio 3 / 4.4, chamfer 20px, gold outline, inner `radial-gradient(120% 70% at 50% 25%,#191919,#050505 70%)`.
- Padding 24px, content bottom-aligned, gap 16px.
- Icon 88px gold, centred.
- Title: Chakra 700 italic, 30→22px, uppercase, `#F2F2F0`, centred.
- Description: Barlow 15px `#A6A6A6`, lh 1.45.
- Gold number notch "01"–"06".

### 2.7 Badge

- Height 24px, padding 0 10px, gap 6px, chamfer 5px.
- Chakra Petch 700, 11px, uppercase, letter-spacing 0.16em.
- Tones: accent gold/#0A0A0A · live #FF2D16/#FFFFFF + pulsing 6px dot · win #B7D43C/#0A0A0A · draw #A6A6A6/#0A0A0A · loss #6E6E6E/#0A0A0A · neutral #3D3D3D/#DCDCDA.
- Static (no hover).

### 2.8 Tag (filter chip)

- Height 26px, padding 0 10px, **square corners**, inset 1px `#2A2A2A` line.
- Barlow 600, 13px, uppercase, letter-spacing 0.06em, `#A6A6A6`.
- Hover (button): text `#F2F2F0`, line `#3D3D3D`.
- Active/selected: fill `#F5B300`, text `#0A0A0A`, no line; hover fill `#FFD34D`.

### 2.9 Navigation (NavBar)

- Height 76px, padding 0 var(--gutter), background `rgba(0,0,0,.92)`, bottom 1px `#2A2A2A`, sticky top, z-index 20+.
- Left: logo emblem 44px. Right: links (gap 24px) + CTA (Button sm primary, margin-left 16px).
- Link: Chakra 600, 15px, uppercase, letter-spacing 0.16em, `#A6A6A6`, padding 8px 0.
  - Hover: `#F2F2F0` (140ms).
  - Active: `#F2F2F0` + 2px gold underline at bottom -2px with `--glow-gold-sm`.
- **≤ 860px**: links hidden, bare IconButton burger (menu ↔ x).
- Drawer: full-width, background `#080808`, padding 16px var(--gutter) 32px, bottom 1px `#2A2A2A`. Links 20px, padding 12px 0, each with bottom 1px `#2A2A2A`; block primary CTA below (margin-top 16px).

### 2.10 Match Row

- Grid `1fr auto 1fr`, gap 16px, padding 16px 20px.
- Team: crest 32×32 (fill `#0A0A0A`, inset 1px line, chamfer 6px, 3-letter gold Chakra 700 12px) + name Chakra 600 17px uppercase letter-spacing 0.02em. Away side is mirrored.
- Centre: LIVE badge (minute `63'`) → score (`--fs-score`, tnum, gold colon) or kick-off time in `#6E6E6E` → meta Barlow 13px `#6E6E6E` (venue, or "Konec").
- Rows in one card are separated by 1px `#2A2A2A`.

### 2.11 Standings Table

- `border-collapse: collapse`, Barlow 15px `#DCDCDA`.
- th: padding 12px, Chakra 600 11px uppercase letter-spacing 0.16em `#6E6E6E`, bottom 1px `#2A2A2A`, nowrap.
- td: padding 12px, bottom 1px `#2A2A2A`.
- Row hover: `#1A1A1A` (140ms).
- Highlighted team: row fill `rgba(245,179,0,.07)` + `inset 2px 0 0 #F5B300` on first cell.
- Rank: width 44px, Chakra 700 tnum `#6E6E6E`. Numbers: right-aligned, Chakra 500 tnum. Points: Chakra 700 17px `#F2F2F0`.
- Columns: # · Tým · Z · V · R · P · Skóre · Forma (last 5 badges V/R/P) · B.
- On mobile: wrap in `overflow-x:auto`.

### 2.12 Stat Block

- Column, gap 2px. Value Chakra 700 26px tnum lh 1 `#F2F2F0` (gold with `accent`, max one per group). Label Chakra 600 11px uppercase 0.16em `#6E6E6E`.

### 2.13 Section Heading

- Column, gap 12px. Optional overline (gold, 13px, 0.34em — max 2 per page) → title H2 (Chakra 700 italic, lh 1.05) → sub Barlow 19px `#A6A6A6`, max-width 56ch. Optional centred.

### 2.14 Logo

- Use supplied `logo-clutch-league.png` only; never redraw/recolour. On true black; if the backdrop is a dark gradient, `mix-blend-mode: lighten`. Min 32px; nav 44px; hero 280–420px (`min(300px,60vw)` in kit).

### 2.15 Icons

- Lucide (lucide-static 0.454.0), 2px stroke, rendered as CSS mask inheriting `currentColor`. Default 20px. Gold for brand symbols, silver for UI. Files in `assets/icons/`.

## 3. Layout Guidelines

| Token | Value |
|---|---|
| Container max-width | 1240px (`--container`) |
| Narrow container (forms, articles) | 760px (`--container-narrow`) |
| Gutter (side padding) | `clamp(20px, 5vw, 48px)` |
| Section vertical rhythm | `clamp(64px, 9vw, 128px)` |
| Grid gap | 24px |
| Page title block | padding-top 64px, padding-bottom 40px |

Breakpoints:

| Name | Range | Behaviour |
|---|---|---|
| Mobile | < 640px | 1 column; buttons may go `block`; nav = burger; table scrolls horizontally; type at clamp minimums |
| Tablet | 640–859px | 2-column grids where content allows; nav still burger |
| Desktop | ≥ 860px | full nav; 2–3 column grids; type scales up to clamp max at ~1240px |

Grid patterns used:
- Two-up sections: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 40px`.
- Rule cards: `repeat(auto-fill, minmax(200px, 1fr)); gap: 20px` (home preview: 3 columns, gap 12px).
- Info cards: `repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 20px`.
- Form rows: `repeat(auto-fit, minmax(220px, 1fr)); gap: 20px`.

Fixed elements: sticky nav only. No floating chat bubbles/back-to-top.

## 4. Animations & Interactions

### 4.1 Durations & easing

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80ms | press translate |
| `--dur-fast` | 140ms | hover colour/background/border |
| `--dur-base` | 220ms | glow, outline flips, card hover |
| `--dur-slow` | 420ms | drawer / panel open |
| `--dur-hero` | 900ms | hero rays + headline |
| `--ease-out` | `cubic-bezier(.2,.8,.3,1)` | default for everything |
| `--ease-in` | `cubic-bezier(.5,0,1,.5)` | exits |
| `--ease-strike` | `cubic-bezier(.16,1.02,.24,1)` | headline "landing" (slight overshoot) |
| `--ease-linear` | `linear` | LIVE pulse |

GSAP equivalents: `--ease-out` ≈ `"power3.out"` (or `CustomEase.create("clOut",".2,.8,.3,1")`); `--ease-strike` → `CustomEase.create("clStrike",".16,1.02,.24,1")`; `--ease-in` ≈ `"power2.in"`.

### 4.2 The one signature moment (home hero, on load)

1. **Rays ignite** — each 1px gold ray `scaleX(0.2 → 1)`, `opacity 0 → 1`, `transform-origin: left center` (right side mirrored via `scaleX(-1)` on the container), 900ms `--ease-out`, staggered from centre outward (~40–60ms per ray). 9 rays per side (direction B: 11).
2. **Logo lands** — `translateY(-14%) scale(1.06) → none`, `opacity 0 → 1`, 900ms `--ease-strike`.
3. **Headline lands** — same keyframe, 120ms delay.

```js
// GSAP reference
gsap.timeline()
  .from(".cl-rays__ray", { scaleX: .2, opacity: 0, duration: .9, ease: "clOut", stagger: { each: .05, from: "center" } })
  .from(".hero-logo", { yPercent: -14, scale: 1.06, opacity: 0, duration: .9, ease: "clStrike" }, 0)
  .from(".hero-title", { yPercent: -14, scale: 1.06, opacity: 0, duration: .9, ease: "clStrike" }, .12);
```

### 4.3 Everything else = reaction to the user

- Hover: colour/background/outline change, 140–220ms `--ease-out`. No scale-ups, no lifts.
- Press: `translateY(1px)`, 80ms, + darker fill (gold-deep).
- Focus: 2px `#FFD34D` outline, offset 2px (instant).
- Nav drawer: open/close 420ms `--ease-out` (height or translateY), no bounce.
- LIVE badge dot: opacity 1 → 0.35 → 1, 1.2s linear infinite.
- Optional sweep (`cl-sweep`) for a gold sheen across a highlighted element, used at most once.
- **No** scroll-triggered reveals, parallax, or "everything slides up".

### 4.4 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
}
```
GSAP: check `matchMedia("(prefers-reduced-motion: reduce)")` and skip the hero timeline (set final state).

```css
/* Clutch League — motion. One hero moment (rays ignite, headline lands). Everything else
   is a reaction to the user. Nothing floats in on scroll. */
:root{
  --dur-instant:80ms; /* @kind other */
  --dur-fast:140ms; /* @kind other */
  --dur-base:220ms; /* @kind other */
  --dur-slow:420ms; /* @kind other */
  --dur-hero:900ms; /* @kind other */

  --ease-out:cubic-bezier(.2,.8,.3,1); /* @kind other */
  --ease-in:cubic-bezier(.5,0,1,.5); /* @kind other */
  --ease-strike:cubic-bezier(.16,1.02,.24,1); /* @kind other */  /* headline "lands" */
  --ease-linear:linear; /* @kind other */

  --t-control:background-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out),box-shadow var(--dur-base) var(--ease-out),border-color var(--dur-fast) var(--ease-out),transform var(--dur-instant) var(--ease-out); /* @kind other */
}

@keyframes cl-rays-ignite{from{opacity:0;transform:scaleX(.2)}to{opacity:1;transform:scaleX(1)}}
@keyframes cl-headline-land{from{opacity:0;transform:translateY(-14%) scale(1.06)}to{opacity:1;transform:none}}
@keyframes cl-live-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes cl-sweep{from{background-position:-140% 0}to{background-position:240% 0}}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important}
}
```

## 5. Content Rules (for generated copy)

- Czech, informal *ty*. Short, direct, captain-in-the-locker-room energy.
- Buttons = exact action: "Přihlásit tým", "Rozpis zápasů", "Vyplnit přihlášku", "Celá tabulka".
- Errors = the fix: "Nepovedlo se. Chybí jméno kapitána."
- Formats: `19:30`, `14. 4.`, `4 900 Kč`, `3:2`, `63'`. Table heads Z / V / R / P / B.
- Banned phrases: "Vítejte", "Odeslat", "Připoj se ke komunitě", "Posuň svou hru na další level", "Omlouváme se, došlo k chybě".

## 6. Full CSS Reference (verbatim)

### 6.1 Utilities
```css
/* Clutch League — utilities. Chamfer frames, halftone/grain layers, gold rays, focus ring. */

.cl-chamfer{--ch:var(--chamfer-md);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-chamfer-all{--ch:var(--chamfer-md);clip-path:polygon(var(--ch) 0,calc(100% - var(--ch)) 0,100% var(--ch),100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,var(--ch) 100%,0 calc(100% - var(--ch)),0 var(--ch))}

/* 1px chamfered outline: the outer layer IS the border colour. */
.cl-frame{--ch:var(--chamfer-md);padding:var(--border-1);background:var(--border-subtle);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-frame>.cl-frame-in{height:100%;background:var(--bg-elevated);clip-path:polygon(calc(var(--chamfer-md) - 1px) 0,100% 0,100% calc(100% - var(--chamfer-md) + 1px),calc(100% - var(--chamfer-md) + 1px) 100%,0 100%,0 calc(var(--chamfer-md) - 1px))}
.cl-frame-gold{background:var(--border-accent)}
.cl-frame-white{background:var(--border-white)}

.cl-halftone{background-image:var(--halftone);background-size:var(--halftone-size)}
.cl-grain{background-image:radial-gradient(rgba(0,0,0,.34) .7px,transparent 1.1px),linear-gradient(var(--white),#D9D9D5);background-size:3px 3px,100% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}

.cl-ray{height:1px;background:var(--ray-gold);filter:drop-shadow(0 0 6px rgba(245,179,0,.7))}
.cl-glow{box-shadow:var(--glow-gold)}

.cl-overline{font-family:var(--font-display);font-weight:var(--fw-semibold);letter-spacing:var(--ls-overline);text-transform:uppercase;font-size:var(--fs-caption);color:var(--text-accent)}
.cl-display{font-family:var(--font-display);font-weight:var(--fw-display);line-height:var(--lh-display);letter-spacing:var(--ls-display);text-transform:uppercase;color:var(--text-heading)}
.cl-num{font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}

:where(a){color:var(--text-link);text-decoration-thickness:1px;text-underline-offset:3px}
:where(a):hover{color:var(--text-link-hover)}
:where(:focus-visible){outline:2px solid var(--focus-ring);outline-offset:2px}
```

### 6.2 Component styles
```css
/* Clutch League — component styles. Chamfered geometry, gold light, 1px lines.
   Pattern for an outlined chamfered box: the element background IS the line colour and
   ::before (inset 1px) paints the fill. No border property survives a clip-path. */

.cl-btn{--ch:var(--chamfer-btn);position:relative;display:inline-flex;align-items:center;justify-content:center;gap:var(--sp-2);height:var(--control-h-md);padding:0 var(--sp-6);font-family:var(--font-display);font-weight:var(--fw-display);font-size:var(--fs-h6);letter-spacing:var(--ls-label);text-transform:uppercase;white-space:nowrap;cursor:pointer;border:0;background:transparent;color:var(--text-heading);transition:var(--t-control);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-btn>*{position:relative;z-index:1}
.cl-btn::before{content:"";position:absolute;inset:1px;z-index:0;background:var(--bg-page);clip-path:polygon(calc(var(--ch) - 1px) 0,100% 0,100% calc(100% - var(--ch) + 1px),calc(100% - var(--ch) + 1px) 100%,0 100%,0 calc(var(--ch) - 1px));transition:background var(--dur-fast) var(--ease-out)}
.cl-btn--sm::before{clip-path:polygon(calc(var(--chamfer-btn-sm) - 1px) 0,100% 0,100% calc(100% - var(--chamfer-btn-sm) + 1px),calc(100% - var(--chamfer-btn-sm) + 1px) 100%,0 100%,0 calc(var(--chamfer-btn-sm) - 1px))}
.cl-btn--sm{clip-path:polygon(var(--chamfer-btn-sm) 0,100% 0,100% calc(100% - var(--chamfer-btn-sm)),calc(100% - var(--chamfer-btn-sm)) 100%,0 100%,0 var(--chamfer-btn-sm));height:var(--control-h-sm);padding:0 var(--sp-4);font-size:var(--fs-caption)}
.cl-btn--lg::before{clip-path:polygon(calc(var(--chamfer-btn-lg) - 1px) 0,100% 0,100% calc(100% - var(--chamfer-btn-lg) + 1px),calc(100% - var(--chamfer-btn-lg) + 1px) 100%,0 100%,0 calc(var(--chamfer-btn-lg) - 1px))}
.cl-btn--lg{clip-path:polygon(var(--chamfer-btn-lg) 0,100% 0,100% calc(100% - var(--chamfer-btn-lg)),calc(100% - var(--chamfer-btn-lg)) 100%,0 100%,0 var(--chamfer-btn-lg));height:var(--control-h-lg);padding:0 var(--sp-8);font-size:var(--fs-h5)}
.cl-btn--block{display:flex;width:100%}

.cl-btn--primary{background:var(--gold-deep);color:var(--text-on-accent)}
.cl-btn--primary::before{background:var(--sheen-gold)}
.cl-btn--primary:hover::before{background:linear-gradient(180deg,#FFE08A,var(--gold-hot) 50%,var(--gold))}
.cl-btn--primary:active{transform:translateY(1px)}
.cl-btn--primary:active::before{background:linear-gradient(180deg,var(--gold),var(--gold-deep))}

.cl-btn--secondary{background:var(--border-white)}
.cl-btn--secondary:hover{background:var(--gold)}
.cl-btn--secondary:hover::before{background:#0E0E0E}
.cl-btn--secondary:hover{color:var(--gold-hot)}
.cl-btn--secondary:active{transform:translateY(1px)}
.cl-btn--secondary:active::before{background:#080808}

.cl-btn--ghost{background:transparent;color:var(--text-muted)}
.cl-btn--ghost::before{background:transparent}
.cl-btn--ghost:hover{color:var(--text-heading)}
.cl-btn--ghost:hover::before{background:var(--overlay-hover)}
.cl-btn--ghost:active::before{background:var(--overlay-press)}

.cl-btn--danger{background:var(--danger);color:var(--danger)}
.cl-btn--danger::before{background:#140604}
.cl-btn--danger:hover::before{background:#240905}

.cl-btn[disabled],.cl-btn[aria-disabled="true"]{pointer-events:none;background:var(--line);color:var(--text-faint);box-shadow:none}
.cl-btn[disabled]::before,.cl-btn[aria-disabled="true"]::before{background:#101010}
.cl-btn--loading>.cl-btn-label{opacity:.45}

.cl-iconbtn{--ch:var(--chamfer-iconbtn);position:relative;display:inline-flex;align-items:center;justify-content:center;width:var(--control-h-md);height:var(--control-h-md);padding:0;cursor:pointer;border:0;color:var(--text-muted);background:var(--border-subtle);transition:var(--t-control);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-iconbtn::before{content:"";position:absolute;inset:1px;background:var(--bg-elevated);clip-path:polygon(calc(var(--ch) - 1px) 0,100% 0,100% calc(100% - var(--ch) + 1px),calc(100% - var(--ch) + 1px) 100%,0 100%,0 calc(var(--ch) - 1px))}
.cl-iconbtn>*{position:relative;z-index:1}
.cl-iconbtn:hover{background:var(--gold);color:var(--gold-hot)}
.cl-iconbtn:active{transform:translateY(1px)}
.cl-iconbtn--sm{width:var(--control-h-sm);height:var(--control-h-sm);clip-path:polygon(var(--chamfer-iconbtn-sm) 0,100% 0,100% calc(100% - var(--chamfer-iconbtn-sm)),calc(100% - var(--chamfer-iconbtn-sm)) 100%,0 100%,0 var(--chamfer-iconbtn-sm))}
.cl-iconbtn--sm::before{clip-path:polygon(calc(var(--chamfer-iconbtn-sm) - 1px) 0,100% 0,100% calc(100% - var(--chamfer-iconbtn-sm) + 1px),calc(100% - var(--chamfer-iconbtn-sm) + 1px) 100%,0 100%,0 calc(var(--chamfer-iconbtn-sm) - 1px))}
.cl-iconbtn--bare{background:transparent}
.cl-iconbtn--bare::before{background:transparent}
.cl-iconbtn--bare:hover{background:transparent;color:var(--gold)}

.cl-icon{display:inline-block;width:1em;height:1em;flex:none;background-color:currentColor;-webkit-mask:var(--cl-icon-src) center/contain no-repeat;mask:var(--cl-icon-src) center/contain no-repeat}

.cl-card{--ch:var(--chamfer-md);position:relative;background:var(--border-subtle);transition:background var(--dur-base) var(--ease-out),box-shadow var(--dur-base) var(--ease-out);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-card__in{position:relative;height:100%;background:var(--bg-elevated);clip-path:polygon(calc(var(--ch) - 1px) 0,100% 0,100% calc(100% - var(--ch) + 1px),calc(100% - var(--ch) + 1px) 100%,0 100%,0 calc(var(--ch) - 1px))}
.cl-card__body{position:relative;z-index:2;padding:var(--sp-6)}
.cl-card--gold{background:var(--border-accent)}
.cl-card--white{background:var(--border-white)}
.cl-card--flat{background:var(--border-subtle)}
.cl-card--flat .cl-card__in{background:var(--bg-page)}
.cl-card--interactive{cursor:pointer}
.cl-card--interactive:hover{background:var(--border-accent)}
.cl-card--interactive:active{transform:translateY(1px)}
.cl-card--glow{background:var(--gold-hot)}
.cl-glow-wrap{display:inline-flex;filter:var(--glow-drop)}
.cl-glow-wrap--block{display:block}
.cl-card__raster{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.5;background-image:var(--halftone);background-size:var(--halftone-size);-webkit-mask:radial-gradient(120% 80% at 50% 0,#000,transparent 70%);mask:radial-gradient(120% 80% at 50% 0,#000,transparent 70%)}
.cl-card__notch{position:absolute;top:0;left:0;z-index:3;display:flex;align-items:flex-start;justify-content:flex-start;padding:4px 18px 10px 10px;font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-weight:var(--fw-display);font-size:var(--fs-h5);line-height:1;color:var(--text-on-accent);background:var(--gold);clip-path:polygon(0 0,100% 0,72% 100%,0 100%)}

.cl-badge{--ch:var(--chamfer-badge);display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;font-family:var(--font-display);font-weight:var(--fw-display);font-size:var(--fs-micro);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-on-accent);background:var(--gold);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-badge--live{background:var(--live);color:#fff;box-shadow:var(--glow-live)}
.cl-badge--live .cl-badge__dot{animation:cl-live-pulse 1.2s var(--ease-linear) infinite}
.cl-badge__dot{width:6px;height:6px;border-radius:var(--radius-pill);background:currentColor}
.cl-badge--win{background:var(--win)}
.cl-badge--draw{background:var(--draw)}
.cl-badge--loss{background:var(--loss);color:#0A0A0A}
.cl-badge--neutral{background:var(--line-strong);color:var(--text-body)}

.cl-tag{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;font-family:var(--font-body);font-weight:var(--fw-semibold);font-size:var(--fs-caption);letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);background:transparent;box-shadow:inset 0 0 0 1px var(--border-subtle);transition:var(--t-control)}
.cl-tag--on{color:var(--text-on-accent);background:var(--gold);box-shadow:none}
button.cl-tag{cursor:pointer}
button.cl-tag:hover{color:var(--text-heading);box-shadow:inset 0 0 0 1px var(--border-strong)}
button.cl-tag--on:hover{color:var(--text-on-accent);background:var(--gold-hot);box-shadow:none}

.cl-field{display:flex;flex-direction:column;gap:var(--sp-2)}
.cl-field__label{font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-micro);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-muted)}
.cl-field__wrap{position:relative;background:var(--border-subtle);transition:background var(--dur-fast) var(--ease-out),box-shadow var(--dur-base) var(--ease-out);clip-path:polygon(var(--chamfer-input) 0,100% 0,100% calc(100% - var(--chamfer-input)),calc(100% - var(--chamfer-input)) 100%,0 100%,0 var(--chamfer-input))}
.cl-field__wrap:focus-within{background:var(--gold);box-shadow:var(--glow-gold-sm)}
.cl-field--error .cl-field__wrap{background:var(--danger)}
.cl-field__input,.cl-field__select,.cl-field__textarea{display:block;width:100%;height:var(--control-h-md);margin:1px;padding:0 var(--sp-4);font-family:var(--font-body);font-size:var(--fs-body);color:var(--text-heading);background:var(--bg-inset);border:0;outline:0;box-sizing:border-box;width:calc(100% - 2px);clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)}
.cl-field__textarea{height:auto;min-height:104px;padding:var(--sp-3) var(--sp-4);line-height:var(--lh-body);resize:vertical}
.cl-field__input::placeholder,.cl-field__textarea::placeholder{color:var(--text-faint)}
.cl-field__select{appearance:none;cursor:pointer;padding-right:var(--sp-10)}
.cl-field__chev{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--gold);pointer-events:none;font-size:14px}
.cl-field__hint{font-family:var(--font-body);font-size:var(--fs-caption);color:var(--text-faint)}
.cl-field--error .cl-field__hint{color:var(--danger)}

.cl-check{display:inline-flex;align-items:flex-start;gap:var(--sp-3);cursor:pointer;font-family:var(--font-body);font-size:var(--fs-body-sm);color:var(--text-body);line-height:1.4}
.cl-check input{position:absolute;opacity:0;width:0;height:0}
.cl-check__box{position:relative;flex:none;width:20px;height:20px;margin-top:1px;background:var(--border-strong);clip-path:polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px);transition:var(--t-control)}
.cl-check__box::before{content:"";position:absolute;inset:1px;background:var(--bg-inset);clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)}
.cl-check:hover .cl-check__box{background:var(--gold-deep)}
.cl-check input:checked+.cl-check__box{background:var(--gold)}
.cl-check input:checked+.cl-check__box::before{background:var(--sheen-gold)}
.cl-check__mark{position:relative;z-index:1;display:block;width:100%;height:100%;color:var(--text-on-accent);opacity:0;font-size:13px;display:flex;align-items:center;justify-content:center}
.cl-check input:checked+.cl-check__box .cl-check__mark{opacity:1}
.cl-check input:focus-visible+.cl-check__box{box-shadow:0 0 0 2px var(--focus-ring)}

.cl-table{width:100%;border-collapse:collapse;font-family:var(--font-body);font-size:var(--fs-body-sm);color:var(--text-body)}
.cl-table th{padding:var(--sp-3) var(--sp-3);text-align:left;font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-micro);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-faint);border-bottom:1px solid var(--border-subtle);white-space:nowrap}
.cl-table td{padding:var(--sp-3) var(--sp-3);border-bottom:1px solid var(--border-subtle);vertical-align:middle}
.cl-table tbody tr{transition:background var(--dur-fast) var(--ease-out)}
.cl-table tbody tr:hover{background:#1A1A1A}
.cl-table tbody tr.is-highlight td{background:rgba(245,179,0,.07)}
.cl-table tbody tr.is-highlight td:first-child{box-shadow:inset 2px 0 0 var(--gold)}
.cl-table__num{text-align:right;font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-weight:var(--fw-medium)}
.cl-table__pts{text-align:right;font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-weight:var(--fw-display);font-size:var(--fs-body);color:var(--text-heading)}
.cl-table__rank{width:44px;font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-weight:var(--fw-display);color:var(--text-faint)}
.cl-table__team{display:flex;align-items:center;gap:var(--sp-3);font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-body-sm);letter-spacing:.02em;text-transform:uppercase;color:var(--text-heading)}
.cl-form-row{display:grid;gap:var(--sp-4)}

.cl-match{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--sp-4);padding:var(--sp-4) var(--sp-5)}
.cl-match__team{display:flex;align-items:center;gap:var(--sp-3);font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-body);letter-spacing:.02em;text-transform:uppercase;color:var(--text-heading);min-width:0}
.cl-match__team--away{flex-direction:row-reverse;text-align:right}
.cl-match__score{display:flex;align-items:baseline;gap:var(--sp-3);font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-weight:var(--fw-display);font-size:var(--fs-score);line-height:1;color:var(--text-heading)}
.cl-match__colon{color:var(--gold);font-size:.6em;transform:translateY(-.15em)}
.cl-match__meta{font-family:var(--font-body);font-size:var(--fs-caption);color:var(--text-faint);text-align:center}
.cl-match__crest{width:32px;height:32px;flex:none;display:grid;place-items:center;font-family:var(--font-display);font-weight:var(--fw-display);font-size:12px;color:var(--gold);background:#0A0A0A;box-shadow:inset 0 0 0 1px var(--border-subtle);clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}

.cl-stat{display:flex;flex-direction:column;gap:2px}
.cl-stat__val{font-family:var(--font-numeric);font-variant-numeric:tabular-nums;font-weight:var(--fw-display);font-size:var(--fs-stat);line-height:1;color:var(--text-heading)}
.cl-stat--accent .cl-stat__val{color:var(--text-accent)}
.cl-stat__label{font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-micro);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-faint)}

.cl-nav{position:relative;z-index:20;display:flex;align-items:center;gap:var(--sp-6);height:76px;padding:0 var(--gutter);background:rgba(0,0,0,.92);border-bottom:1px solid var(--border-subtle)}
.cl-nav__links{display:flex;align-items:center;gap:var(--sp-6);margin-left:auto}
.cl-nav__link{position:relative;padding:var(--sp-2) 0;font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-h6);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-muted);text-decoration:none;background:none;border:0;cursor:pointer;transition:color var(--dur-fast) var(--ease-out)}
.cl-nav__link:hover{color:var(--text-heading)}
.cl-nav__link.is-active{color:var(--text-heading)}
.cl-nav__link.is-active::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--gold);box-shadow:var(--glow-gold-sm)}
.cl-nav__cta{margin-left:var(--sp-4)}
.cl-nav__burger{display:none;margin-left:auto}
.cl-nav__drawer{display:flex;flex-direction:column;gap:var(--sp-1);padding:var(--sp-4) var(--gutter) var(--sp-8);background:#080808;border-bottom:1px solid var(--border-subtle)}
.cl-nav__drawer .cl-nav__link{font-size:var(--fs-h4);padding:var(--sp-3) 0;border-bottom:1px solid var(--border-subtle)}
.cl-nav--mobile .cl-nav__links{display:none}
.cl-nav--mobile .cl-nav__burger{display:inline-flex}
@media (max-width:860px){.cl-nav .cl-nav__links{display:none}.cl-nav .cl-nav__burger{display:inline-flex}}

.cl-logo{display:inline-flex;align-items:center;gap:var(--sp-3);text-decoration:none}
.cl-logo__img{display:block;height:100%;width:auto}
.cl-logo__type{display:flex;flex-direction:column;line-height:1}
.cl-logo__word{font-family:var(--font-display);font-weight:var(--fw-display);font-style:italic;letter-spacing:-.01em;text-transform:uppercase;color:var(--text-heading)}
.cl-logo__sub{font-family:var(--font-display);font-weight:var(--fw-semibold);letter-spacing:var(--ls-overline);text-transform:uppercase;color:var(--gold)}

.cl-rays{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.cl-rays__side{position:absolute;top:0;bottom:0;width:50%;display:flex;flex-direction:column;justify-content:center;gap:12px}
.cl-rays__side--l{left:0;align-items:flex-start}
.cl-rays__side--r{right:0;align-items:flex-end;transform:scaleX(-1)}
.cl-rays__ray{height:1px;background:var(--ray-gold);transform-origin:left center;animation:cl-rays-ignite var(--dur-hero) var(--ease-out) both}
.cl-rays__dots{position:absolute;top:50%;transform:translateY(-50%);width:240px;height:60%;opacity:.55;background-image:var(--halftone);background-size:var(--halftone-size);-webkit-mask:linear-gradient(90deg,#000,transparent);mask:linear-gradient(90deg,#000,transparent)}
.cl-rays__dots--l{left:0}
.cl-rays__dots--r{right:0;-webkit-mask:linear-gradient(270deg,#000,transparent);mask:linear-gradient(270deg,#000,transparent)}

.cl-sectionhead{display:flex;flex-direction:column;gap:var(--sp-3)}
.cl-sectionhead__over{font-family:var(--font-display);font-weight:var(--fw-semibold);font-size:var(--fs-caption);letter-spacing:var(--ls-overline);text-transform:uppercase;color:var(--gold)}
.cl-sectionhead__title{font-family:var(--font-display);font-weight:var(--fw-display);font-style:italic;font-size:var(--fs-h2);line-height:var(--lh-heading);letter-spacing:var(--ls-display);text-transform:uppercase;color:var(--text-heading);margin:0}
.cl-sectionhead__sub{font-family:var(--font-body);font-size:var(--fs-body-lg);line-height:var(--lh-body);color:var(--text-muted);max-width:56ch;margin:0}
.cl-sectionhead--center{align-items:center;text-align:center}

.cl-rulecard{--ch:var(--chamfer-lg);position:relative;aspect-ratio:3/4.4;background:var(--border-accent);clip-path:polygon(var(--ch) 0,100% 0,100% calc(100% - var(--ch)),calc(100% - var(--ch)) 100%,0 100%,0 var(--ch))}
.cl-rulecard__in{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:var(--sp-4);padding:var(--sp-6);background:radial-gradient(120% 70% at 50% 25%,#191919,#050505 70%);clip-path:polygon(calc(var(--ch) - 1px) 0,100% 0,100% calc(100% - var(--ch) + 1px),calc(100% - var(--ch) + 1px) 100%,0 100%,0 calc(var(--ch) - 1px))}
.cl-rulecard__raster{position:absolute;inset:0;opacity:.45;background-image:var(--halftone);background-size:var(--halftone-size);-webkit-mask:radial-gradient(90% 60% at 50% 40%,transparent 30%,#000);mask:radial-gradient(90% 60% at 50% 40%,transparent 30%,#000)}
.cl-rulecard__art{position:relative;flex:1;display:grid;place-items:center;width:100%;color:var(--gold);font-size:88px}
.cl-rulecard__title{position:relative;font-family:var(--font-display);font-weight:var(--fw-display);font-style:italic;font-size:var(--fs-h3);line-height:1;letter-spacing:-.01em;text-transform:uppercase;color:var(--text-heading);text-align:center}
.cl-rulecard__desc{position:relative;font-family:var(--font-body);font-size:var(--fs-body-sm);line-height:1.45;color:var(--text-muted);text-align:center}
```
