# Animation System

## Motion Principles

1. **GPU-only:** `transform` and `opacity` only. No `width`, `height`, `margin`, `padding` transitions.
2. **Consistent timing:** All interactions 200ms. Chart interpolation 350ms.
3. **Cubic ease-out:** `cubic-bezier(0.4, 0, 0.2, 1)` — natural deceleration.
4. **Accessibility:** `prefers-reduced-motion` disables all animations.

---

## CSS Animation Classes

### `.interactive`
Unified press/hover system for all clickable elements.
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
:hover  → filter: brightness(1.1)
:active → transform: scale(0.97)
```
**Used by:** Header buttons, heatmap cells, ticker items, launch dots.

### `.row-hover`
Subtle horizontal shift for list rows.
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
:hover → transform: translateX(2px)
```
**Used by:** Leaderboard rows, LiveFeed rows.

### `.glow-hover`
Cyan glow for important panels.
```css
transition: box-shadow 0.3s ease-out;
:hover → box-shadow: 0 0 12px rgba(0, 240, 255, 0.15)
```
**Available for use, not currently applied.**

---

## Continuous Animations

| Animation | Duration | Timing | Target |
|---|---|---|---|
| `animate-ticker` | 54s | linear, infinite | Bottom price ticker |
| `animate-ping` | 1s (default) | cubic-bezier, infinite | Radar rings, pulse indicators |
| `animate-pulse` | 2s (default) | cubic-bezier, infinite | Status dots |
| `animate-spin` | 1s (default) | linear, infinite | Loading spinners |

All continuous animations have:
- `will-change: transform, opacity`
- `backface-visibility: hidden`

---

## Canvas Animations

### EcosystemMap Physics
- Agent drift: `Math.random() * 0.06` per frame (smooth Brownian motion)
- Damping: `velocity *= 0.96` per frame (high inertia)
- Gravity toward active coin: `acceleration = 0.12` toward target
- Coin oscillation: `sin(time + index) * 0.08` (gentle floating)

All values tuned for "calm but alive" feel — no jitter, no sudden stops.

### PriceChart Interpolation
```typescript
const t = Math.min(1, elapsed / 350);        // 0→1 over 350ms
const ease = 1 - Math.pow(1 - t, 3);          // ease-out cubic
const data = prev[i] + (target[i] - prev[i]) * ease;
```
When new data arrives:
1. Old data → `prevPricesRef`
2. New data → `targetPricesRef`  
3. Each frame: interpolate between old and new
4. Complete after 350ms

### Trade Pulse Animation (EcosystemMap)
When a buy/sell event fires:
1. Create a glowing link between agent and coin
2. Alpha starts at 1.0, decays by 0.015 per frame
3. A light particle travels along the link
4. Link removed when alpha ≤ 0

---

## What NOT to animate

- `width`, `height`, `padding`, `margin` → causes layout reflow
- `left`, `top`, `right`, `bottom` → no GPU acceleration
- `font-size`, `font-weight` → text reflow
- `background-color` without `will-change` → repaint
- `box-shadow` on large elements → expensive repaint

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations respect OS-level motion reduction preference.
