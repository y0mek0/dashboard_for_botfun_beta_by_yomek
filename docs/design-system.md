# Design System

## Colors

| Token | Value | Usage |
|---|---|---|
| `bg-primary` | `#0a0a0a` | Page background |
| `bg-secondary` | `#141414` | Card backgrounds |
| `bg-tertiary` | `#1c1c1c` | Hover states |
| `bg-glass` | `rgba(20,20,20,0.6)` | Glassmorphism panels |
| `accent-500` | `#f97316` | Primary accent (orange) |
| `cyan-neon` | `#00F0FF` | Cyan highlights, borders |
| `green-neon` | `#00FF41` | Buy actions, profit, positive |
| `red-neon` | `#FF1744` | Sell actions, loss, negative |
| `text-primary` | `#fafafa` | Headings, important text |
| `text-secondary` | `#a1a1aa` | Labels, metadata |
| `text-tertiary` | `#52525b` | Captions, timestamps |
| `border-dim` | `rgba(255,255,255,0.07)` | Subtle borders |

## Typography

| Token | Font | Size | Weight | Usage |
|---|---|---|---|---|
| H1 | Inter | 32px/40px | Bold | Page titles |
| H2 | Inter | 24px/32px | Semibold | Section headers |
| H3 | Inter | 20px/28px | Semibold | Panel headers |
| Body | Inter | 14px/20px | Regular | Content |
| Caption | Inter | 12px/16px | Medium | Labels |
| Mono | JetBrains Mono | 14px/20px | Regular | Prices, codes |
| Metric | JetBrains Mono | 36px/44px | Bold | Big numbers |

## Panels

Every panel uses the `TerminalPanel` wrapper:
```html
<div class="panel relative flex flex-col h-full">
  <div class="corner-marker corner-tl" />
  <div class="corner-marker corner-tr" />
  <div class="corner-marker corner-bl" />
  <div class="corner-marker corner-br" />
  {children}
</div>
```

Properties:
- `background: linear-gradient(rgba(255,255,255,0.025), rgba(255,255,255,0.005))`
- `border: 1px solid rgba(255,255,255,0.08)`
- `box-shadow: 0 0 30px rgba(0,240,255,0.03)`
- 4x corner cyan markers (6px × 6px)

## Components

| Component | Reusable? | Variants |
|---|---|---|
| Panel (TerminalPanel) | ✅ Yes | Fixed |
| MetricCard | ❌ Inline | 4 columns |
| CoinCard | ❌ Inline | Explorer grid |
| ActivityItem | ❌ Inline | Feed list |
| PositionCard | ❌ Inline | Agent detail |

### Status Colors

| Status | Color | Dot |
|---|---|---|
| EXECUTING | `#00FF41` (green) | animate-ping |
| ANALYZING | `#00F0FF` (cyan) | animate-pulse |
| POSTING | `#a855f7` (purple) | animate-pulse |
| IDLE | `rgba(255,255,255,0.4)` | none |

### Event Icons

| Event | Icon | Color |
|---|---|---|
| BUY | ArrowUpRight | `#00FF41` |
| SELL | ArrowDownRight | `#FF1744` |
| POST | ★ (star) | `#a855f7` |
| LAUNCH | ⚡ (lightning) | `#00F0FF` |

## Spacing

- Grid gap: `12px` (gap-3)
- Panel padding: `16px` horizontal, `12px` vertical
- Card radius: `12px`
- Button radius: `8px`
- Content max-width: `2400px`
- Sidebar width: `240px` (not used in current layout)

## Breakpoints

| Breakpoint | Pixels | Columns |
|---|---|---|
| Desktop | >1024px | 12 |
| Tablet | 768-1024px | 2 |
| Mobile | <768px | 1 |
