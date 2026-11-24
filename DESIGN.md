# Design System — Cynsical / Promos

## Anti-slop rules (enforced on every change)

### Banned (makes the page look AI-generated)
- Purple/indigo gradient backgrounds (the #1 AI tell)
- Gradient text on headlines
- Glow on cards / buttons / text (box-shadow blur)
- Glassmorphism on every panel (backdrop-blur + translucent bg)
- Continuously animating elements (spinning rings, pulsing dots, infinite equalizer bars)
- Centered stack of everything (logo → headline → subhead → button)
- 3+ equal-height cards in a row
- Sparkle / fire / rocket emoji as decoration
- "Reimagine What's Possible" prompt-like headlines
- Fade-up-on-scroll on every element
- 600ms animations on button presses
- Inter as both body AND display font
- Mixed icon styles (line + filled + emoji)
- Identical border-radius everywhere

### Required
- **One accent color** → `#e8b339` (warm gold) for primary actions/highlights
- **One grey family** → zinc (cool grey, consistent)
- **One radius scale** → inputs 6px, cards 12px, pills 9999px, modals 20px
- **One icon set** → Lucide (line, single stroke weight)
- **Typography pairing**: Space Grotesk (display) + Inter (body)
- **Sentence case** for all copy
- **Asymmetric layout** — 60/40 splits, varied card heights
- **Calm motion**: one entrance animation per page, 100-150ms on interactions, cubic-bezier easing
- **transform/opacity only** — never animate width/height
- **All four states** on interactive elements: rest, hover, focus, active
- **Reduced-motion fallbacks** via `prefers-reduced-motion`
- **Skeleton loading states** that match content shape
- **Real content** — real numbers, real names, specific copy

## Tokens

```
--accent: #e8b339          /* warm gold — the ONE accent */
--bg: #0c0c0e              /* near-black, not pure black */
--surface: #161618          /* card background */
--border: #26262a           /* subtle border */
--text: #ededf0             /* primary text */
--text-muted: #8a8a92       /* secondary text */
--radius-input: 6px
--radius-card: 12px
--radius-modal: 20px
```

## Motion

```
--ease: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
--duration-fast: 120ms      /* buttons, toggles */
--duration-normal: 200ms    /* panels, cards */
--duration-slow: 400ms      /* page entrance */
```
