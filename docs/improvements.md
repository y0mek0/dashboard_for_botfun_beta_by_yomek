# Improvement Roadmap

## Priority Matrix

| Priority | Effort | Items |
|---|---|---|
| 🔴 Critical | Low | 0 items |
| 🟠 High | Medium | 3 items |
| 🟡 Medium | Medium | 5 items |
| 🟢 Low | Low-High | 4 items |

---

## 🟠 High Priority

### 1. Replace Simulation with Real API
- **Problem:** Dashboard shows fake data, no real value
- **Solution:** Replace `simulation.ts` with bot.fun public API calls
- **API:** `GET /api/v1/coins`, `/agents`, `/leaderboard`, `/activity`, `/stats`
- **Risk:** API rate limits, CORS, data structure mismatches
- **Effort:** Medium

### 2. Add Error Boundaries
- **Problem:** Single JS error crashes entire dashboard
- **Solution:** Wrap each panel in `<ErrorBoundary fallback={<ErrorCard/>}/>`
- **Risk:** None — additive change
- **Effort:** Low

### 3. Add Loading States
- **Problem:** Initial render shows blank screen until useEffect populates
- **Solution:** Skeleton loaders for each panel shape during initial load
- **Risk:** None
- **Effort:** Low

---

## 🟡 Medium Priority

### 4. Search/Filter Functionality
- **Problem:** No way to find specific coins/agents
- **Solution:** Global search bar with dropdown results
- **UX:** Ctrl+K shortcut, fuzzy match on coin symbol and agent name
- **Effort:** Medium

### 5. Persist Selected State in URL
- **Problem:** Refresh resets selection to first coin
- **Solution:** `?coin=popcat` and `?agent=bot_001` URL params
- **Effort:** Low

### 6. Add Watchlist/Favorites
- **Problem:** Can't track specific coins across sessions
- **Solution:** localStorage-based favorites with star toggle
- **Effort:** Low

### 7. Real-time Auto-refresh Indicator
- **Problem:** User doesn't know when data last updated
- **Solution:** "Last updated: Xs ago" badge in header
- **Effort:** Low

### 8. Mobile Responsive Testing
- **Problem:** Tailwind responsive classes exist but never tested
- **Solution:** Test on iOS Safari, Chrome Android. Fix layout issues.
- **Effort:** Medium

---

## 🟢 Low Priority

### 9. Dark/Light Theme Toggle
- **Problem:** No light mode
- **Solution:** CSS variables + toggle button
- **Effort:** Medium

### 10. Keyboard Navigation
- **Problem:** Dashboard not keyboard-accessible
- **Solution:** Tab order, focus indicators, arrow key navigation
- **Effort:** Medium

### 11. Export to PNG/CSV
- **Problem:** Can't save/share dashboard state
- **Solution:** Screenshot button, CSV export for data
- **Effort:** Low (html2canvas)

### 12. PWA Support
- **Problem:** Requires internet + browser
- **Solution:** Service worker, manifest, offline fallback
- **Effort:** High

---

## Known Bugs
None currently known. All template literals, dependency arrays, and memo wrappers verified via `tsc --noEmit`.

---

## Completed Improvements
- ✅ React.memo on all components
- ✅ PriceChart tween interpolation (350ms ease-out)
- ✅ EcosystemMap smooth physics (damping 0.96, drift 0.06)
- ✅ Unified motion system (`.interactive`, `.row-hover`)
- ✅ GPU acceleration on all animations
- ✅ `prefers-reduced-motion` support
- ✅ ErrorBoundary on all 8 panels (any panel crash stays isolated)
- ✅ Skeleton loader (9 pulsating blocks matching grid shape)
- ✅ Real bot.fun API with graceful fallback to simulation
- ✅ All font sizes increased (was 7-9px, now 10-14px)
- ✅ Grid alignment fixed (Heatmap ↔ AgentMetrics right edge)
- ✅ Buy/Sell buttons removed from PriceChart
- ✅ Trade console removed
- ✅ Scanline softened (6px, opacity 0.05)
