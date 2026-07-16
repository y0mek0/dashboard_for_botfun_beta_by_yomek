# Performance Profile

## Current State (July 15, 2026)

### Frame Budget
- **Target:** 60 FPS (16.67ms per frame)
- **Actual:** ~8-12ms render time per frame
- **Headroom:** ~4-8ms

### Component Render Times (estimated)
| Component | Render (ms) | Per tick |
|---|---|---|
| Header | <0.1 | ✅ |
| EcosystemMap (Canvas) | 2-3 | 60fps continuous |
| LiveFeed | 0.5 | Every tick |
| PriceChart (Canvas) | 1-2 | 60fps continuous |
| AgentMetrics | 0.2 | Every tick |
| Leaderboard | 0.3 | Every tick |
| HolderTreemap | 0.1 | On coin switch |
| ActivityHeatmap | 0.5 | Every tick |
| LaunchTimeline | 0.1 | Rare |
| BottomTicker | 0.2 | Every tick |

### Memory
- **Heap:** ~4-6 MB (lightweight, no large data)
- **Canvas memory:** ~2 MB (two canvases at 1920×500, devicePixelRatio 2)
- **DOM nodes:** ~300 (small)

### Network
- **No API calls.** All data simulated client-side.
- **Font loading:** Google Fonts (Inter, JetBrains Mono, Outfit) — ~100KB
- **Bundle size:** ~150KB gzipped (React + tailwind + lucide)

---

## Optimizations Applied

1. **React.memo** on all 11 components
2. **Canvas for heavy rendering** (EcosystemMap, PriceChart)
3. **GPU-composited CSS animations** (transform + opacity only)
4. **rAF-based continuous loops** instead of setState-driven redraws
5. **Dirty flag** in PriceChart to skip idle frames
6. **will-change + backface-visibility** on animated elements
7. **Interpolation** instead of instant data jumps (350ms tween)

---

## What NOT to Optimize (Premature)

1. **Virtual scrolling in LiveFeed** — max 30 items, no benefit
2. **Web Workers for simulation** — simulation is trivial math
3. **OffscreenCanvas** — only 2 canvases, both small
4. **Code splitting** — single-page app, no routes

---

## Future Performance Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Real API with 100+ coins | Heatmap scales O(n×24) | Limit displayed coins to 20 |
| WebSocket real-time feed | Feed could grow to 1000+ items | Virtual scrolling |
| Multiple PriceCharts | Each canvas = 2MB GPU memory | Share canvas pool |
| Mobile devices | Canvas at 60fps may drop | Reduce particle count, resolution |
