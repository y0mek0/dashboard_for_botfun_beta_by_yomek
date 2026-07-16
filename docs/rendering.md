# Rendering Architecture

## Canvas Components

### EcosystemMap
**Type:** Continuous rAF loop (60fps)
**Triggers:** The physics+render loop runs every frame via requestAnimationFrame. It does NOT restart when data changes — node positions are stored in refs and updated in-place.

```
Frame tick:
  1. ctx.clearRect(0, 0, w, h)
  2. Draw background grid
  3. Update agent physics (drift, gravity toward coins)
  4. Draw neural links (agent→coin connections)
  5. Draw event pulses (fading trade animations)
  6. Draw coin nodes (circles + labels + change badges)
  7. Draw agent particles
  8. requestAnimationFrame(render) → next frame
```

**Performance:** ~500 draw calls per frame (8 agents + 12 coins + links). GPU-bound, not CPU-bound. No layout thrashing.

### PriceChart
**Type:** Continuous rAF loop (60fps)
**Triggers:** Effect runs on mount, sets up rAF loop. Loop checks dirty flag.

```
Mount:
  → Start rAF loop
  → Draw chart with initial data

Data update (coin.priceHistory changes):
  → Save current data as prevPricesRef
  → Save new data as targetPricesRef
  → Set animStartRef = now
  → Set dirtyRef = true

Each frame:
  → Calculate elapsed time
  → Compute ease-out cubic interpolation
  → If elapsed < 350ms: keep dirty = true, redraw next frame
  → If elapsed >= 350ms: animation complete
  → Draw chart with interpolated data
```

**Performance:** ~200 draw calls per frame. Full canvas redraw each frame during animation. With dirty check, idle frames have ~10 draw calls (just background).

---

## DOM Components

All 9 DOM components use React.memo with default shallow comparison.

### Re-render frequency
| Component | Renders per tick |
|---|---|
| Header | Every tick |
| LiveFeed | Every tick (new events prepended) |
| Leaderboard | Every tick (agent PnL changes) |
| AgentMetrics | Every tick (agent status changes) |
| HolderTreemap | Only on coin switch (memoized) |
| ActivityHeatmap | Every tick (activity values change) |
| LaunchTimeline | Rarely (only on new launches) |
| BottomTicker | Every tick (prices change) |

### Virtual DOM behavior
- `React.memo` prevents re-render when props unchanged
- Each tick creates NEW arrays/objects → all memoized components see "changed" props
- This is CORRECT behavior — data actually changes each tick
- Full re-render of ~15 DOM nodes per tick is acceptable (<1ms)

---

## CSS Animations (GPU-accelerated)

```
.animate-ticker  → transform: translate3d()   [GPU composite layer]
.animate-ping    → transform + opacity        [GPU composite layer]
.animate-pulse   → opacity only               [GPU composite layer]
.animate-spin    → transform: rotate()        [GPU composite layer]
.interactive     → transform + filter         [GPU with will-change]
.row-hover       → transform: translateX()    [GPU composite layer]
```

All animated elements use `will-change` and `backface-visibility: hidden` to promote to GPU layers.

---

## Potential Bottlenecks

1. **EcosystemMap full-canvas redraw** each frame (500 draw calls). Acceptable for dashboard.
2. **PriceChart full-canvas redraw** during 350ms animation. Short duration, acceptable.
3. **15 DOM re-renders per tick** at 1Hz — never a bottleneck.
4. **No virtualization** in LiveFeed — max 30 items, safe.
