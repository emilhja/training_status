# Training Status

Daily fitness status report that pulls data from Intervals.icu and Smashrun, stores each snapshot in a local SQLite database, and serves a React dashboard with live charts.

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
│   │       └── services/      # External API clients
│   │           ├── intervals.py
│   │           ├── smashrun.py
│   │           └── analytics.py
│   ├── tests/            # Test suite
│   └── pyproject.toml
├── frontend/             # React + Vite frontend
│   ├── src/
│   ├── dist/            # Production build
│   └── package.json
├── data/                 # SQLite database (gitignored)
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

### Frontend
| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI framework |
| **TypeScript** | ~5.9 | Type safety |
| **Vite** | 7 | Dev server and bundler |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Recharts** | 3 | Charts (CTL/ATL/TSB, HRV, weekly km) |
| **React Router** | 7 | Client-side routing between tabs |

### External APIs
| API | What it provides |
|---|---|
| **Intervals.icu Wellness API** | CTL, ATL, TSB, HRV, resting HR, sleep, VO2max |
| **Smashrun API** | Lifetime run count, total distance, weekly km |

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

| Variable | Where to find it |
|---|---|
| `INTERVALS_ID` | Your athlete ID in the Intervals.icu browser URL (e.g. `iABC123`) |
| `INTERVALS_API_KEY` | Intervals.icu → Settings → scroll to bottom |
| `SMASHRUN_TOKEN` | [api.smashrun.com/explorer](https://api.smashrun.com/explorer) → Connect → copy `access_token` from URL |

> `.env` is not committed — keep it local. Never share your API keys.

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

Or with the module path:

```bash
cd backend/src
python -m training_status.cli
```

Fetches data, prints the report, saves to `data/training_status.db`, and exports `training_status.txt`.

### Running Tests

```bash
cd backend
pytest
```

## Dashboard tabs

| Tab | Description |
|---|---|
| **Current** | Colour-coded metric cards for all training load and health fields |
| **Charts** | CTL/ATL/TSB line chart, HRV + Resting HR chart, weekly km bar chart |
| **History** | Scrollable table of all stored snapshots |
| **Refresh** | Trigger a new fetch from the browser |

## Output fields

See [docs/API_FIELDS.md](docs/API_FIELDS.md) for complete field reference.

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

### Smashrun — Running Totals

| Field | Description |
|---|---|
| Total Distance (km) | Lifetime total |
| Run Count (Total) | Lifetime run count |
| This week km | Current week (Monday → today) |
| Week 1–4 (Mon–Sun) km | Last 4 calendar weeks, most recent first |

## Database

All data is stored in `data/training_status.db` (SQLite, single file, no server required).

**Table: `snapshots`**

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Auto-increment primary key |
| `recorded_at` | TEXT | ISO 8601 timestamp |
| `ctl` | REAL | Chronic Training Load |
| `atl` | REAL | Acute Training Load |
| `tsb` | REAL | Training Stress Balance |
| ... | ... | See docs/API_FIELDS.md for full schema |

## API Endpoints

All endpoints return JSON and are documented with Pydantic models.

| Endpoint | Method | Description |
|---|---|---|
| `/api/snapshots/latest` | GET | Get most recent snapshot |
| `/api/snapshots` | GET | Get paginated snapshots |
| `/api/fetch` | POST | Trigger data fetch from external APIs |
| `/api/goals` | GET/POST | Manage training goals |
| `/api/analytics/consistency` | GET | Training consistency score |
| `/api/analytics/recommendation` | GET | Workout recommendation |
| `/api/analytics/projections` | GET | 7-day fitness projections |
| `/api/analytics/injury-risk` | GET | Injury risk assessment |
| `/api/export/json` | GET | Export all data as JSON |
| `/api/export/csv` | GET | Export all data as CSV |

## Security

- **Input validation**: All API endpoints use Pydantic models
- **SQL injection prevention**: Parameterized queries throughout
- **Type safety**: Full type hints with mypy checking
- **Environment management**: Centralized config with validation; credentials stored in `.env`, never committed

**Authentication:** The API has **no authentication**. This is intentional — it is a personal tool designed to run on localhost. If you ever expose port 8000 on a network (e.g. via a reverse proxy or `--host 0.0.0.0`), add a layer of protection such as HTTP Basic Auth in your reverse proxy, a firewall rule, or a bearer token middleware.

**CORS:** The `cors_origins` setting defaults to `http://localhost:5173` (the Vite dev server). In production the frontend is served from the same origin as the API, so CORS headers are not enforced and the setting has no effect in that mode.

## Development

### Code Quality

```bash
# Format code
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
