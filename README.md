# Training Status

Daily fitness status report that pulls data from Intervals.icu, Smashrun, and optionally Strava. Stores each snapshot in a local SQLite database and serves a React dashboard with live charts and analytics.

## Project Structure

```
training_status/
├── backend/              # Python FastAPI backend
│   ├── src/
│   │   └── training_status/
│   │       ├── api.py         # FastAPI routes
│   │       ├── cli.py         # CLI entry point
│   │       ├── config.py      # Settings management
│   │       ├── models.py      # Pydantic schemas
│   │       ├── database/      # Database layer
│   │       │   ├── db.py
│   │       │   └── schema.py
│   │       └── services/      # External API clients & analytics
│   │           ├── intervals.py
│   │           ├── smashrun.py
│   │           ├── analytics.py
│   │           └── reports.py
│   ├── tests/            # Test suite
│   └── pyproject.toml
├── frontend/             # React + Vite frontend
│   ├── src/
│   ├── dist/            # Production build
│   └── package.json
├── data/                 # SQLite database and PDF reports (gitignored)
├── scripts/
│   └── setup.sh         # One-time setup script
├── docs/                # Documentation
│   ├── API_FIELDS.md
│   └── TODO.md
├── requirements.txt      # Python dependencies
├── start.sh             # Dev mode (hot reload)
├── start-prod.sh        # Production mode (LAN accessible)
├── start-both.sh        # Dev + prod simultaneously
└── README.md
```

## Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| **Python** | ≥ 3.10 | Runtime |
| **FastAPI** | ≥ 0.104 | HTTP API framework |
| **Uvicorn** | ≥ 0.24 | ASGI server |
| **Pydantic v2** | ≥ 2.5 | Data validation and serialization |
| **pydantic-settings** | ≥ 2.1 | Config and `.env` loading |
| **SQLite** | built-in | Storage (single-file, no server) |
| **Requests** | ≥ 2.31 | HTTP client for external APIs |
| **APScheduler** | ≥ 3.10 | Background job scheduler (auto-fetch, PDF reports) |
| **ReportLab** | ≥ 4.0 | Weekly PDF report generation |

### Frontend
| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI framework |
| **TypeScript** | ~5.9 | Type safety |
| **Vite** | 7 | Dev server and bundler |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Recharts** | 3 | Charts (CTL/ATL/TSB, HRV, weekly km, etc.) |
| **React Router** | 7 | Client-side routing between tabs |
| **Vitest** | ≥ 4.0 | Unit testing |

### External APIs
| API | What it provides | Required |
|---|---|---|
| **Intervals.icu Wellness API** | CTL, ATL, TSB, HRV, resting HR, sleep, VO2max, pace curves | Yes |
| **Smashrun API** | Lifetime run count, total distance, weekly km, streaks | Yes |
| **Strava API** | Weekly km, total km, YTD km, run count | Optional |

### Dev tooling
| Tool | Purpose |
|---|---|
| **pytest + pytest-asyncio** | Backend test suite |
| **httpx** | Async HTTP client for FastAPI test client |
| **ruff** | Python linting and formatting |
| **mypy** | Static type checking |
| **ESLint + typescript-eslint** | Frontend linting |

## Setup

```bash
# First-time setup (creates venv, installs deps, sets up .env)
./scripts/setup.sh
```

Or manually:

```bash
# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies (for development)
cd frontend
npm install
```

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Where to find it |
|---|---|---|
| `INTERVALS_ID` | Yes | Your athlete ID in the Intervals.icu browser URL (e.g. `iABC123`) |
| `INTERVALS_API_KEY` | Yes | Intervals.icu → Settings → scroll to bottom |
| `SMASHRUN_TOKEN` | Yes | [api.smashrun.com/explorer](https://api.smashrun.com/explorer) → Connect → copy `access_token` from URL |
| `STRAVA_CLIENT_ID` | No | Strava API application settings |
| `STRAVA_CLIENT_SECRET` | No | Strava API application settings |
| `STRAVA_REFRESH_TOKEN` | No | OAuth flow result |
| `FETCH_SCHEDULE` | No | Cron expression for auto-fetch (default: `0 6 * * *` = 6 AM daily) |
| `REPORT_SCHEDULE` | No | Cron expression for weekly PDF (default: `0 7 * * 1` = Monday 7 AM) |

> `.env` is not committed — keep it local. Never share your API keys.
>
> Strava fields are optional. If omitted, Strava columns in snapshots are null.
>
> Set `FETCH_SCHEDULE=""` or `REPORT_SCHEDULE=""` to disable the respective background job.

## Running

### Dev mode (hot reload)

```bash
./start.sh
```

Starts the backend on [http://localhost:8000](http://localhost:8000) with `--reload` and the Vite frontend on [http://localhost:5173](http://localhost:5173).

### Production mode (LAN accessible)

```bash
./start-prod.sh
```

Builds the frontend if needed, then serves the API + SPA from a single uvicorn process on `0.0.0.0:8000`. Access from your phone via `http://<LAN-IP>:8000`.

### Both simultaneously (dev + phone testing)

```bash
./start-both.sh
```

Runs dev mode (backend :8000 + Vite :5173) and a separate prod server on :8080 accessible from the local network. Useful for developing on your computer while testing on your phone at the same time.

### Mobile / PWA install

The app is a Progressive Web App that opens as a standalone app (no browser chrome). Chrome and Safari both require **HTTPS** for standalone mode — a plain `http://` shortcut just opens in the browser.

#### One-time setup: HTTPS on LAN

Certificates are already generated in `certs/` using [mkcert](https://github.com/FiloSottile/mkcert). The start scripts auto-detect and use them.

To trust the certificate on your **Android phone** (do this once):

1. On your computer, find the CA file:
   ```
   ~/.local/share/mkcert/rootCA.pem
   ```
2. Transfer it to your phone (AirDrop, email, USB, or `python3 -m http.server` in that folder)
3. On Android: **Settings → Security → Encryption & credentials → Install a certificate → CA certificate** → select `rootCA.pem`
4. Accept the warning and install

#### Add to home screen

1. Start the server: `./start-prod.sh` or `./start-both.sh`
2. Open `https://<LAN-IP>:8000` (or `:8080`) in Chrome on your phone
3. Tap the **three-dot menu** (⋮) → **Add to Home screen** (or **Install app**)
4. Tap **Add**

**iPhone (Safari):** Same CA install process via Settings → General → VPN & Device Management. Then open in Safari → Share → Add to Home Screen.

Once installed it opens fullscreen with no browser chrome, caches assets for fast loads, and syncs in the background.

### CLI only (no web)

```bash
cd backend
python -m training_status.cli
```

Fetches data, prints the report, saves to `data/training_status.db`, and exports `training_status.txt`.

### Running Tests

```bash
cd backend
pytest
```

## Dashboard

The dashboard has multiple views accessible via the bottom navigation bar:

| View | Description |
|---|---|
| **Overview** | Configurable widget dashboard — readiness score, smart alerts, workout suggestion, goals, injury risk |
| **Training** | CTL/ATL/TSB details, ramp rate, Critical Speed model (CS + D') |
| **Health** | HRV with Garmin-style colored bars, resting HR, sleep, VO2max, wellness scores |
| **Running** | Weekly km, streaks, pace, Smashrun lifetime stats |
| **Activities** | Recent activities from Intervals.icu grouped by sport type |
| **Trends** | 7-day fitness projections, detraining estimates, taper planner, overload tracking |
| **Log** | Training notes, chart annotations, personal records (800m–Marathon) |
| **Gear** | Shoe/equipment tracking with km accumulation and retirement thresholds |
| **Settings** | Theme toggle, data export (JSON/CSV), share links, goal management |

Alternative layouts available: **Compact** (small screens) and **Accordion** (collapsible sections).

## Analytics

The backend computes a range of derived metrics beyond raw data:

| Feature | Description |
|---|---|
| **Readiness Score** | Composite 0–100 from TSB, HRV trend, sleep, fatigue, soreness |
| **Workout Suggestion** | Rule-based recommendation for today based on readiness and load |
| **Injury Risk** | Multivariate assessment (ramp rate, HRV, sleep, fatigue) — low/moderate/high/critical |
| **Race Predictor** | Predicted times for 800m–Marathon using critical speed + D' model |
| **Critical Speed** | Fitted from Intervals.icu pace curves over the last 42 days |
| **Training Zones** | HR zones (Karvonen) and pace zones derived from critical speed |
| **Taper Calculator** | Week-by-week volume reduction schedule towards a target race |
| **Detraining Estimator** | 6-week CTL/ATL/TSB decay projection if training stops |
| **Overload Tracker** | Week-over-week volume change — detects unsafe jumps or deloads |
| **HR Drift Analysis** | Identifies easy runs where HR drifted into higher zones |
| **Sleep Insights** | Sleep score vs duration correlation; optimal sleep for peak HRV |
| **Correlation Analysis** | Data-driven relationships across 30 data points (e.g. weather ↔ HRV) |
| **Consistency Score** | 0–100 training consistency over rolling window |
| **Goal Adherence** | Week-by-week history of km goal compliance |
| **Weekly Summary** | 7-day digest vs previous week (km, CTL, HRV, rest days) |

## Background Scheduler

The backend runs background jobs via APScheduler:

| Job | Default schedule | Purpose |
|---|---|---|
| Auto-fetch | `0 6 * * *` (6 AM daily) | Fetch fresh data from all external APIs and store snapshot |
| Weekly report | `0 7 * * 1` (Monday 7 AM) | Generate PDF report in `data/reports/` |

Both can be overridden or disabled via `.env`.

## Database

All data is stored in `data/training_status.db` (SQLite, single file, no server required).

### Tables

| Table | Purpose |
|---|---|
| `snapshots` | Training data snapshots — one row per fetch, 73 columns |
| `goals` | Training goals (weekly/monthly/yearly km, weekly sessions) |
| `personal_records` | Detected race PRs for standard distances (800m–Marathon) |
| `training_notes` | Free-text training log entries keyed by date |
| `gear` | Shoes and equipment with accumulated km and retirement threshold |
| `health_events` | Illness, injury, and rest period log with date ranges and tags |
| `annotations` | Chart annotations linked to a date and metric |
| `shared_links` | Read-only public share tokens with optional expiry |

### Snapshot columns (key fields)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-increment primary key |
| `recorded_at` | TEXT | ISO 8601 timestamp |
| `ctl` / `atl` / `tsb` | REAL | Training load metrics |
| `ramp_rate` | REAL | Weekly CTL change |
| `hrv` / `hrv_sdnn` | REAL | HRV from Garmin |
| `resting_hr` | INTEGER | Morning resting HR |
| `sleep_secs` / `sleep_quality` / `sleep_score` | REAL/INTEGER | Sleep data |
| `vo2max` | REAL | Estimated VO2max |
| `critical_speed` | REAL | Critical Speed in m/s (fitted from pace curves) |
| `d_prime` | REAL | Anaerobic work capacity in meters |
| `stress` / `readiness` | REAL | Garmin stress and readiness scores |
| `weight` / `body_fat` | REAL | Body metrics |
| `mood` / `motivation` / `fatigue` / `soreness` | INTEGER | Wellness ratings (1–5) |
| `hr_zone_z1_secs` … `hr_zone_z5_secs` | INTEGER | Time in each HR zone |
| `elevation_gain_m` / `avg_cadence` / `max_hr` | REAL/INTEGER | Activity metrics |
| `week_0_km` … `week_4_km` | REAL | Rolling weekly distances |
| `strava_weekly_km` / `strava_total_km` / `strava_ytd_km` | REAL | Strava stats (if configured) |
| `weather_temp` / `weather_humidity` / `weather_type` | REAL/TEXT | Weather at fetch time |

See [docs/API_FIELDS.md](docs/API_FIELDS.md) for the complete field reference.

## API Endpoints

All endpoints return JSON and are validated with Pydantic models.

> **Rate limiting:** `POST /api/fetch` enforces a 5-minute cooldown (HTTP 429 if exceeded) to prevent excessive external API calls.

### Snapshots & Data

| Endpoint | Method | Description |
|---|---|---|
| `/api/snapshots/latest` | GET | Most recent snapshot |
| `/api/snapshots` | GET | Paginated snapshot history |
| `/api/fetch` | POST | Trigger fetch from all external APIs |

### Goals

| Endpoint | Method | Description |
|---|---|---|
| `/api/goals` | GET | All active goals |
| `/api/goals` | POST | Create a goal (`weekly_km`, `monthly_km`, `yearly_km`, `weekly_weightlifting_sessions`) |
| `/api/goals/{goal_id}` | DELETE | Deactivate a goal |

### Personal Records & Notes

| Endpoint | Method | Description |
|---|---|---|
| `/api/personal-records` | GET | Detected race PRs (800m–Marathon) |
| `/api/notes` | GET | Training log notes |
| `/api/notes` | POST | Add a training note |
| `/api/notes/{note_id}` | DELETE | Delete a note |

### Activities

| Endpoint | Method | Description |
|---|---|---|
| `/api/activities/weekly` | GET | Recent activities grouped by sport type |
| `/api/strava/status` | GET | Strava integration status |

### Analytics

| Endpoint | Method | Description |
|---|---|---|
| `/api/analytics/consistency` | GET | Training consistency score (0–100) |
| `/api/analytics/recommendation` | GET | Workout recommendation |
| `/api/analytics/projections` | GET | 7-day CTL/ATL/TSB projections |
| `/api/analytics/injury-risk` | GET | Injury risk assessment |
| `/api/analytics/correlations` | GET | Metric correlation insights |
| `/api/analytics/race-predictor` | GET | Race time predictions |
| `/api/analytics/detraining` | GET | Fitness decay projection |
| `/api/analytics/summary` | GET | 7-day training digest |
| `/api/analytics/adherence` | GET | Goal adherence history |
| `/api/analytics/readiness` | GET | Composite readiness score |
| `/api/analytics/workout-suggestion` | GET | Rule-based workout for today |
| `/api/analytics/overload` | GET | Week-over-week volume changes |
| `/api/analytics/zones` | GET | HR and pace training zones |
| `/api/analytics/hr-drift` | GET | HR drift analysis |
| `/api/analytics/sleep-insights` | GET | Sleep optimization insights |
| `/api/analytics/taper` | GET | Taper schedule calculator |

### Gear & Health

| Endpoint | Method | Description |
|---|---|---|
| `/api/gear` | GET | All active gear items |
| `/api/gear` | POST | Add new gear |
| `/api/gear/{gear_id}` | PUT | Update gear details |
| `/api/gear/{gear_id}` | DELETE | Retire gear |
| `/api/health-events` | GET | Health event log |
| `/api/health-events` | POST | Log illness/injury/rest period |
| `/api/health-events/{event_id}` | PUT | Update a health event |
| `/api/health-events/{event_id}` | DELETE | Delete a health event |
| `/api/annotations` | GET | Chart annotations |
| `/api/annotations` | POST | Add annotation |
| `/api/annotations/{ann_id}` | DELETE | Delete annotation |

### Share Links

| Endpoint | Method | Description |
|---|---|---|
| `/api/share` | POST | Create read-only share link (optional expiry) |
| `/api/share` | GET | List active share links |
| `/api/share/{token}` | DELETE | Revoke a share link |
| `/api/shared/{token}` | GET | Public read-only snapshot view |

### Export & Reports

| Endpoint | Method | Description |
|---|---|---|
| `/api/export/json` | GET | Export all data as JSON |
| `/api/export/csv` | GET | Export all data as CSV |
| `/api/reports` | GET | List available weekly PDF reports |
| `/api/reports/latest` | GET | Download most recent PDF report |
| `/api/reports/{filename}` | GET | Download a specific PDF report |
| `/api/reports/generate` | POST | Generate a PDF report on demand |

## Security

- **Input validation**: All API endpoints use Pydantic models with strict type and range checks
- **SQL injection prevention**: Parameterized queries throughout
- **Rate limiting**: `POST /api/fetch` — 5-minute cooldown, returns HTTP 429
- **Type safety**: Full type hints with mypy checking
- **Environment management**: Centralized config with validation; credentials stored in `.env`, never committed

**Authentication:** The API has **no authentication**. This is intentional — it is a personal tool designed to run on localhost. If you ever expose port 8000 on a network (e.g. via a reverse proxy or `--host 0.0.0.0`), add a layer of protection such as HTTP Basic Auth in your reverse proxy, a firewall rule, or a bearer token middleware.

**Share links** provide a scoped read-only exception — a token grants access to a single public snapshot endpoint only.

**CORS:** The `cors_origins` setting defaults to `http://localhost:5173` (the Vite dev server). In production the frontend is served from the same origin as the API, so CORS headers are not enforced.

## Development

### Code Quality

```bash
# Format and lint
cd backend
ruff check src tests
ruff format src tests

# Type check
mypy src
```

### Adding New Features

1. Add Pydantic models to `models.py`
2. Add database queries to `database/db.py`
3. Add business logic to `services/`
4. Add API endpoints to `api.py`
5. Add tests to `tests/`

See [docs/TODO.md](docs/TODO.md) for planned features.
