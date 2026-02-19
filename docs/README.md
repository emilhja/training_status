# Training Status

Daily fitness status report that pulls data from Intervals.icu and Smashrun, stores each snapshot in a local SQLite database, and serves a React dashboard with live charts.

## Setup

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Where to find it |
|---|---|
| `INTERVALS_ID` | Your athlete ID in the Intervals.icu browser URL (e.g. `iABC123`) |
| `INTERVALS_API_KEY` | Intervals.icu → Settings → scroll to bottom |
| `SMASHRUN_TOKEN` | [api.smashrun.com/explorer](https://api.smashrun.com/explorer) → Connect → copy `access_token` from URL |

> `.env` is not committed — keep it local. Never share your API keys.

## Running

### Web dashboard (production)

```bash
./start.sh
```

Opens at [http://localhost:8000](http://localhost:8000). Builds the frontend if needed, then serves the API + SPA from a single uvicorn process.

### Dev mode (hot reload)

```bash
# Terminal 1 — API
uvicorn api:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173) with Vite hot reload.

### CLI only (no web)

```bash
python main.py
```

Fetches data, prints the report, saves to `training_status.db`, and exports `training_status.txt`.

## Dashboard tabs

| Tab | Description |
|---|---|
| **Current** | Colour-coded metric cards for all training load and health fields |
| **Charts** | CTL/ATL/TSB line chart, HRV + Resting HR chart, weekly km bar chart |
| **History** | Scrollable table of all stored snapshots |
| **Refresh** | Trigger a new fetch from the browser |

## Output fields

### Intervals.icu — Training Load & Health

| Field | Source | Label logic |
|---|---|---|
| Fitness (CTL) | Wellness API | good = ramp rate > 2 / ok = ≥ 0 / bad = declining |
| Fatigue (ATL) | Wellness API | good = ATL < CTL / ok = ratio ≤ 1.3 / bad = > 1.3 |
| Stress Balance (TSB) | CTL − ATL | good = > 5 / ok = −10 to 5 / bad = < −10 |
| Workload Ratio (A:C) | ATL ÷ CTL | good = 0.8–1.3 / ok = 1.3–1.5 / bad = outside |
| Resting HR | Wellness API (from Garmin) | — |
| HRV | Wellness API (from Garmin) | — |
| Sleep | Wellness API (from Garmin) | quality label + duration + score /100 |
| VO2max | Wellness API (from Garmin, post-run) | falls back to most recent non-null value |
| Steps | Wellness API (from Garmin) | — |
| SpO2 | Wellness API (from Garmin, when available) | — |
| Rest Days | Days since last activity | — |
| Monotony | Mean ÷ StdDev of 7-day daily loads | — |
| Training Strain | Weekly load × Monotony | — |

**Not available via API:** Effective VO2max (Runalyze metric), Endurance %, Garmin Training Readiness, Garmin stress score, Critical Speed (CS), D′ — `eFTPSupported` is false for Run sport type.

> Garmin stress and body battery *can* appear once enabled under Intervals.icu → Connections → Garmin → Health Data.

### Smashrun — Running Totals

| Field | Description |
|---|---|
| Total Distance (km) | Lifetime total |
| Run Count (Total) | Lifetime run count |
| Longest Run (km) | Lifetime longest run |
| Avg Pace | Lifetime average pace |
| This week km | Current week (Monday → today) |
| Week 1–4 (Mon–Sun) km | Last 4 calendar weeks, most recent first |
| Last Month km | Previous calendar month total |

## Database

All data is stored in `training_status.db` (SQLite, single file, no server required).

**Table: `snapshots`**

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-increment primary key |
| `recorded_at` | TEXT | ISO 8601 timestamp |
| `ctl` | REAL | Chronic Training Load |
| `atl` | REAL | Acute Training Load |
| `tsb` | REAL | Training Stress Balance |
| `ramp_rate` | REAL | Weekly CTL ramp rate |
| `ac_ratio` | REAL | ATL ÷ CTL |
| `resting_hr` | INTEGER | Resting heart rate (bpm) |
| `hrv` | REAL | Heart rate variability (ms) |
| `sleep_secs` | INTEGER | Sleep duration in seconds |
| `sleep_quality` | INTEGER | 1=Good 2=OK 3=Bad |
| `sleep_score` | REAL | Sleep score 0–100 |
| `rest_days` | INTEGER | Days since last activity |
| `monotony` | REAL | Training monotony (7-day) |
| `training_strain` | REAL | Training strain (7-day) |
| `vo2max` | REAL | VO2max from Garmin |
| `steps` | INTEGER | Daily step count |
| `spo2` | REAL | Blood oxygen % |
| `total_distance_km` | REAL | Smashrun lifetime distance |
| `run_count` | INTEGER | Smashrun lifetime run count |
| `longest_run_km` | REAL | Smashrun longest run |
| `avg_pace` | TEXT | Smashrun lifetime avg pace |
| `week_0_km` | REAL | Current week (Mon → today) km |
| `week_1_km` – `week_4_km` | REAL | Last 4 calendar weeks (km) |
| `last_month_km` | REAL | Previous calendar month (km) |
| `intervals_json` | TEXT | Raw Intervals.icu API response |
| `smashrun_json` | TEXT | Raw Smashrun API response |

Example queries:

```sql
-- VO2max and HRV trend
SELECT recorded_at, vo2max, hrv, resting_hr FROM snapshots ORDER BY recorded_at DESC;

-- Weekly running volume over time
SELECT recorded_at, week_0_km, week_1_km, week_2_km, week_3_km, week_4_km FROM snapshots ORDER BY recorded_at DESC;

-- Training load trend
SELECT recorded_at, ctl, atl, tsb, ac_ratio FROM snapshots ORDER BY recorded_at DESC;
```
