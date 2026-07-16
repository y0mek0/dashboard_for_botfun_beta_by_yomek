# Testing Plan

## Manual Test Checklist

### Layout
- [ ] Grid columns sum to 12 in all rows
- [ ] No horizontal overflow at 1920×1080
- [ ] No horizontal overflow at 1366×768
- [ ] Bottom ticker does not overlap main content
- [ ] Scanline does not block interaction

### Components
- [ ] Header shows correct stats
- [ ] Ecosystem Map renders coin ring + agent particles
- [ ] Live Feed shows events with correct colors
- [ ] Price Chart renders line + volume + pressure
- [ ] Agent Metrics shows AVG PNL, TOT TRADES, radar, state bars
- [ ] Leaderboard shows sorted agents with PnL bars
- [ ] Holder Treemap shows supply distribution
- [ ] Activity Heatmap shows 24h grid with colors
- [ ] Launch Timeline shows dots on line
- [ ] Bottom Ticker scrolls smoothly

### Interactions
- [ ] Click coin in Heatmap → PriceChart updates
- [ ] Click agent in Leaderboard → row highlights
- [ ] Hover chart → crosshair appears
- [ ] Hover Ecosystem nodes → tooltip appears
- [ ] Pause button stops simulation
- [ ] FREQ dropdown changes tick speed
- [ ] Hover ticker → pauses scroll

### Animations
- [ ] PriceChart transitions smoothly (no jump)
- [ ] Ecosystem agents float smoothly (no jitter)
- [ ] Pulse/ping/spin animations smooth (no stutter)
- [ ] Interactive elements have press feedback (scale 0.97)
- [ ] Row hover has translateX(2px)
- [ ] Ticker scrolls at consistent speed

### Accessibility
- [ ] prefers-reduced-motion disables animations
- [ ] Text is selectable (select-text)
- [ ] No content flashes faster than 3/sec

### Browser
- [ ] Chrome (latest) — primary
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)

---

## Automated Checks

```bash
# TypeScript
npx tsc --noEmit        # ✅ 0 errors as of July 15, 2026

# Build
npx vite build           # Currently fails due to esbuild decimal parsing
                         # Dev mode works fine

# Lint
# No linter configured yet
```

---

## Known Build Issue

`vite build` fails because esbuild parses Tailwind classes with decimals (e.g., `gap-1.5`) as JSX expressions. This is a known esbuild limitation.

**Workaround:** Run `vite --port 3002` for development. Production build requires either:
- Replacing all decimal classes (gap-1.5 → gap-2)
- Or wrapping classes with decimals in JSX expressions: `className={'gap-1.5'}`

**Not fixed** because the dashboard is currently development-only (no deployment target).
