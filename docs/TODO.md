# TODO

## Mobile UX improvements

- [ ] Mobile navigation — sidebar takes 60% of screen on phones; needs hamburger/drawer pattern or bottom tab bar
- [ ] Touch targets — most buttons are 24–36px, need 44px minimum (nav links, toggles, inputs)
- [ ] Grid breakpoints — all grids jump from `grid-cols-2` to `lg:grid-cols-4`, missing `md:` step
- [ ] Calendar heatmap — 16px cells with 10px text, unreadable on mobile; needs 4-week mobile view or horizontal scroll
- [ ] Chart responsiveness — fixed heights and margins, Y-axis labels clip on narrow screens
- [ ] 10px text — `text-[10px]` in CompactDashboard labels and CalendarHeatmap, min should be 12px
- [ ] Form inputs — most use `py-1.5`, need `py-2`+ for comfortable mobile tap

## PWA / HTTPS (low priority)

- [ ] Deploy behind nginx + certbot for real HTTPS → enables proper standalone PWA install on Android without mkcert CA setup
- [ ] Until then: mkcert certs are in `certs/` and start scripts auto-detect them (see README)
