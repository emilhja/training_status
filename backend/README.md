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
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/             # React + Vite frontend
│   ├── src/
│   ├── dist/            # Production build
│   └── package.json
├── data/                 # SQLite database (gitignored)
├── scripts/
│   └── start.sh         # Production startup script
├── docs/                # Documentation
│   ├── API_FIELDS.md
│   └── TODO.md
└── README.md
```

## Setup

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies (for development)
cd ../frontend
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

### Web dashboard (production)

```bash
./scripts/start.sh
```

Opens at [http://localhost:8000](http://localhost:8000). Builds the frontend if needed, then serves the API + SPA from a single uvicorn process.

### Dev mode (hot reload)

```bash
# Terminal 1 — API
cd backend
uvicorn training_status.api:app --reload --port 8000 --app-dir src

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173) with Vite hot reload.

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

## Security Improvements

This refactored version includes:

- **Input validation**: All API endpoints use Pydantic models
- **SQL injection prevention**: Parameterized queries throughout
- **CORS restrictions**: Limited to localhost:5173 in development
- **Type safety**: Full type hints with mypy checking
- **Environment management**: Centralized config with validation

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
