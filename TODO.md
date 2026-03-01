# Future Enhancements

## Planned Features (Priority Order)

### 1. Security & Reliability Hardening ✅
- [x] Add authentication (API key or basic auth) so LAN neighbours can't read/mutate data
- [x] Rate-limit `POST /api/fetch` to prevent accidental external API spam
- [x] Validate input lengths on all text fields (notes, gear, health events, annotations)
- [x] Remove duplicate SW API caching (already handled by IndexedDB layer)
- [x] Per-widget error boundaries so one broken widget can't crash the whole view
- [x] Lazy-load heavy chart/analytics components to improve PWA initial load
- [x] `AbortController` in hooks to avoid state updates on unmounted components
- [x] Expose share link revocation UI (list & revoke active shared links)
- [x] Move inline correlation logic in `api.py` into `analytics.py` for consistency

### ~~5. PWA (Progressive Web App)~~ ✅
- [x] Add service worker for offline mode
- [x] Create manifest.json for installability
- [x] Implement background sync (retry POST /api/fetch when back online)
- [x] Add daily reminder notifications (client-side, configurable in Settings)
- [x] Caching strategy for last sync data (network-first API, cache-first static)

### 6. Voice Commands
- [ ] Google Assistant integration
- [ ] Alexa skill for "What's my training status?"
- [ ] Siri shortcuts support
- [ ] Voice-based data entry

### 7. Widgets
- [ ] iOS home screen widget
- [ ] Android widget
- [ ] Apple Watch complications
- [ ] Garmin Connect IQ widget
- [ ] Simple status display (CTL/TSB/HRV)

### 8. Webhook Support
- [ ] Slack integration
- [ ] Discord webhooks
- [ ] Zapier integration
- [ ] Custom webhook URLs
- [ ] Event triggers (goal reached, new PR, etc.)

### 12. Season Planner
- [ ] Visual calendar for race preparation
- [ ] Periodization templates (base/build/peak/taper)
- [ ] Mesocycle planning
- [ ] Visual timeline with CTL targets
- [ ] Race countdown integration


### 13. Test out the unofficial garmin-connect repo
- [ ] https://github.com/cyberjunky/python-garminconnect

### 14. Multi-Sport Split
- [ ] Split CTL/ATL/TSB by sport (cycling vs running) using Intervals.icu sport-specific load data
- [ ] Per-sport training load charts
- [ ] Separate weekly volume tracking per sport
- [ ] Configurable sport weighting for composite metrics

### 15. Full Season Planner (upgrade of Training Plan Adherence)
- [ ] Visual calendar for full race season
- [ ] Periodization templates (base/build/peak/taper) with week-by-week km targets
- [ ] Mesocycle planning with CTL targets per phase
- [ ] Compare planned vs actual CTL trajectory over full season
- [ ] Race countdown integration with taper projection

### 16. Peer Comparison (Anonymized)
- [ ] Optional opt-in to share anonymized snapshots
- [ ] Benchmark your CTL, HRV, weekly km against cohort percentiles
- [ ] Cohort filters: age group, weekly volume range, primary sport
- [ ] Requires shared data layer (backend service outside localhost)

### 17. Body Weight vs Performance Correlation
- [ ] Correlate weight snapshots with race pace / VO2max trends
- [ ] Scatter plot of weight vs critical speed
- [ ] Optimal weight range estimation based on performance data
- [ ] Requires consistent weight logging in Intervals.icu

### 18. AI Training Coach Chat
- [ ] Requires external LLM API integration (OpenAI / Anthropic)
- [ ] Send current snapshot context + historical trend as system prompt
- [ ] Chat interface component in a dedicated view
- [ ] Rate limiting and API key management
- [ ] Privacy consideration: data sent externally

### 19. Social Accountability - Remaining Features
(Basic shared-link version is implemented — see `/api/share`)
- [ ] Multi-user support: user accounts, per-user data isolation
- [ ] Public leaderboard / cohort comparison (opt-in)
- [ ] Follow other users and view their public summaries
- [ ] Requires proper auth layer (JWT or session-based)
- [ ] Requires PostgreSQL or multi-tenant SQLite strategy

## Completed Features ✅
See API_FIELDS.md and git history for implemented features.

### Recently Added
- Training Readiness Score (composite 0-100)
- Workout Suggestion Engine (rule-based daily recommendation)
- Progressive Overload Tracker (week-over-week volume alerts)
- Training Zones Auto-Calculator (Karvonen HR + CS pace zones)
- Heart Rate Drift Analysis (aerobic efficiency tracking)
- Sleep Optimization Insights (sleep vs HRV correlation)
- Taper Calculator (exponential/linear/step models)
- Shoe/Gear Tracker (mileage tracking with retirement alerts)
- Acute Illness/Injury Log (health event timeline)
- Metric Annotations (chart markers via API)
- Social Accountability - Basic (read-only shared links)
- Weekly PDF Report (scheduled + on-demand generation)
- Customizable Dashboard (widget reorder/toggle via localStorage)
- Onboarding / Empty States (reusable EmptyState component)

### A. Keyboard Shortcuts ✅
- [x] `r` — trigger data refresh from anywhere in the app
- [x] `1`–`9` — jump to views (Overview, Training, Health, Analysis, Running, Activities, Trends, Log, Gear)
- [x] Show shortcut reference panel (press `?`)

### B. Snapshot Diff View ✅
- [x] Select any two dates and compare metrics side-by-side
- [x] Color-coded delta column (green = improvement, red = regression)
- [ ] Chart overlay: plot both snapshots' CTL/ATL/TSB curves on same axes

### C. Expanded Annotation Metrics ✅
- [x] Annotations now support: `ctl`, `atl`, `hrv`, `tsb`, `resting_hr`, `sleep_score`, `vo2max`, `weight`, `week_0_km`, `general`
- [ ] Allow annotation on any arbitrary metric name (open text field)

### D. Data Integrity Check Endpoint ✅
- [x] `GET /api/health` — public endpoint, returns DB status, table list, and latest snapshot age
- [ ] Frontend status page / widget showing last-fetch age and DB health

### E. Database Backup Endpoint ✅
- [x] `GET /api/export/db` — auth-gated, downloads the raw SQLite file for full backup/restore
- [ ] Frontend "Download DB" button in Settings → Export section

### F. Garmin Connect Integration (excluded — requires SSO)
- [ ] Test `python-garminconnect` unofficial repo
- [ ] Requires secure credential storage (not plain `.env`) due to Garmin SSO
- See TODO item #13

### G. Goal Progress Push Notifications ✅
- [x] After each Refresh, check if any weekly_km goal is met — show celebratory toast
- [ ] Send a browser push notification via Service Worker when goal is crossed (requires SW message passing)

### H. Per-Snapshot Notes ✅
- [x] `training_notes` table now has `snapshot_id INTEGER` column (migration applied automatically)
- [x] `POST /api/notes` accepts optional `snapshot_id` to link a note to a specific snapshot
- [x] `createNote()` in frontend API accepts optional `snapshot_id`
- [ ] UI: note entry form in LogView shows "Link to today's snapshot" checkbox

## Contributing
Feel free to pick up any of these features! Create a branch and submit a PR.
