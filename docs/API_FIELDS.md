# API Fields Reference

All fields available from each API endpoint, with current values noted where useful. Fields marked **✓ used** are stored in the DB. Fields marked **— null** were null in the live response.

---

## Intervals.icu

### `GET /api/v1/athlete/{id}/wellness` (latest entry)

| Field | Type | Value / Notes | Used |
|---|---|---|---|
| `id` | string | Date (e.g. `2026-02-18`) | |
| `ctl` | float | Chronic Training Load | ✓ |
| `atl` | float | Acute Training Load | ✓ |
| `rampRate` | float | Weekly CTL ramp rate | ✓ (as `ramp_rate`) |
| `restingHR` | int | Resting heart rate (bpm) from Garmin | ✓ |
| `hrv` | float | HRV RMSSD (ms) from Garmin | ✓ |
| `hrvSDNN` | float | HRV SDNN variant | ✓ |
| `sleepSecs` | int | Sleep duration in seconds | ✓ |
| `sleepQuality` | int | 1=Good 2=OK 3=Bad | ✓ |
| `sleepScore` | float | Sleep score 0–100 from Garmin | ✓ |
| `avgSleepingHR` | float | Average HR during sleep | — null |
| `vo2max` | float | VO2max from Garmin (only updated after runs) | ✓ (with fallback) |
| `steps` | int | Daily step count from Garmin | ✓ |
| `spO2` | float | Blood oxygen % from Garmin | ✓ |
| `stress` | float | Garmin stress score | ✓ (needs Garmin Health Data enabled in Intervals.icu → Connections) |
| `readiness` | float | Garmin readiness score | ✓ |
| `respiration` | float | Breathing rate | — null |
| `baevskySI` | float | Stress index from HRV | — null |
| `weight` | float | Body weight | ✓ (sync from Garmin or manual entry) |
| `bodyFat` | float | Body fat % | ✓ |
| `mood` | int | Subjective mood (1–5) | ✓ (manual entry in Intervals) |
| `motivation` | int | Subjective motivation (1–5) | ✓ |
| `fatigue` | int | Subjective fatigue (1–5) | ✓ |
| `soreness` | int | Subjective soreness (1–5) | ✓ |
| `injury` | string | Injury notes | — null |
| `comments` | string | Free-text notes | ✓ |
| `kcalConsumed` | float | Calories consumed | — null |
| `carbohydrates` | float | Carbs (g) | — null |
| `protein` | float | Protein (g) | — null |
| `fatTotal` | float | Fat (g) | — null |
| `hydration` | float | Hydration level | — null |
| `hydrationVolume` | float | Fluid intake (ml) | — null |
| `lactate` | float | Blood lactate | — null |
| `bloodGlucose` | float | Blood glucose | — null |
| `abdomen` | float | Abdominal circumference | — null |
| `systolic` / `diastolic` | int | Blood pressure | — null |
| `menstrualPhase` | string | Menstrual phase | — null |
| `sportInfo` | array | Per-sport FTP/W′ data | — null values inside |

---

### `GET /api/v1/athlete/{id}` (athlete profile)

| Field | Type | Notes | Used |
|---|---|---|---|
| `sportSettings[].types` | array | Sport types for this settings block (e.g. `["Run", ...]`) | ✓ (filter for Run) |
| `sportSettings[].ftp` | float | Critical Speed in m/s for Run (set manually in Intervals.icu → Settings → Sports → Run) | ✓ (as `critical_speed`) |
| `sportSettings[].w_prime` | float | D′ in metres for Run | ✓ (as `d_prime`) |

---

### `GET /api/v1/athlete/{id}/activities`

| Field | Type | Notes | Used |
|---|---|---|---|
| `id` | string | Activity ID | |
| `name` | string | Activity name | |
| `type` | string | `Run`, `Ride`, etc. | |
| `start_date_local` | string | Local start datetime | ✓ (for date bucketing) |
| `distance` | float | Distance in metres | |
| `moving_time` | int | Moving time (seconds) | |
| `elapsed_time` | int | Total elapsed time (seconds) | |
| `average_heartrate` | int | Average HR (bpm) | |
| `max_heartrate` | int | Max HR (bpm) | |
| `average_cadence` | float | Average cadence (spm) | |
| `average_speed` | float | Average speed (m/s) | |
| `pace` | float | Pace (m/s) | |
| `gap` | float | Grade-adjusted pace (m/s) | |
| `calories` | int | Estimated calories | |
| `total_elevation_gain` | float | Elevation gain (m) | |
| `total_elevation_loss` | float | Elevation loss (m) | |
| `icu_training_load` | int | Training load (HRSS or similar) | ✓ (for monotony/strain) |
| `icu_ctl` | float | CTL after this activity | |
| `icu_atl` | float | ATL after this activity | |
| `icu_intensity` | float | Intensity factor | |
| `icu_rpe` | int | RPE (1–10) | |
| `hr_load` | int | HR-based load | |
| `trimp` | float | Training impulse score | |
| `feel` | int | How you felt (1–5) | |
| `session_rpe` | int | Session RPE × 30 | |
| `device_name` | string | e.g. `Garmin fenix 7 Pro` | |
| `source` | string | e.g. `GARMIN_CONNECT` | |
| `icu_resting_hr` | int | Resting HR recorded this day | |
| `icu_weight` | float | Body weight at time of activity | |
| `polarization_index` | float | Polarization index | |
| `icu_rolling_cp` | float | Critical Power (rolling) | — null (eFTPSupported=false for Run) |
| `icu_rolling_ftp` | float | Rolling FTP | — null |
| `icu_rolling_w_prime` | float | Rolling W′ / D′ | — null (`eFTPSupported=false` for Run) |
| `ss_cp` / `icu_pm_cp` | float | Critical Speed / Power | — null (`eFTPSupported=false` for Run) |
| `icu_weighted_avg_watts` | float | Normalized power | — null (no power meter) |
| `icu_average_watts` | float | Average power | — null |
| `average_temp` | float | Ambient temperature | — null (not in Garmin sync) |
| `total_elevation_gain` | float | Elevation gain (m) | ✓ (from latest activity) |
| `total_elevation_loss` | float | Elevation loss (m) | |
| `average_cadence` | float | Average cadence (spm) | ✓ |
| `max_heartrate` | int | Max HR (bpm) | ✓ |
| `icu_hr_zone_times` | array | Seconds in each HR zone | ✓ (z1-z5 stored separately) |
| `icu_rpe` | int | RPE (1–10) | ✓ |
| `feel` | int | How you felt (1–5) | ✓ |

---

## Smashrun

### `GET /v1/my/stats`

| Field | Type | Notes | Used |
|---|---|---|---|
| `totalDistance` | float | Lifetime distance (km) | ✓ |
| `runCount` | int | Lifetime run count | ✓ |
| `longestRun` | float | Longest single run (km) | ✓ |
| `averagePace` | string | Lifetime avg pace (e.g. `5:52`) | ✓ |
| `averageRunLength` | float | Average run length (km) | |
| `averageSpeed` | float | Average speed (km/h) | |
| `mostOftenRunOnDay` | string | Day of week most runs | ✓ |
| `mostOftenRunOnCount` | int | Count for above | |
| `mostOftenRunOnAverageDistance` | float | Avg distance on that day | |
| `leastOftenRunOnDay` | string | Day of week fewest runs | |
| `leastOftenRunOnCount` | int | Count for above | |
| `leastOftenRunOnAverageDistance` | float | Avg distance on that day | |
| `longestStreak` | int | Longest daily streak (days) | ✓ |
| `longestStreakDate` | string | Date streak ended | ✓ |
| `longestBreakBetweenRuns` | int | Longest gap (days) | ✓ |
| `longestBreakBetweenRunsDate` | string | Date gap ended | ✓ |
| `daysRunAM` | int | Runs before noon | ✓ |
| `daysRunPM` | int | Runs after noon | ✓ |
| `daysRunBoth` | int | Days with AM + PM run | ✓ |
| `averageDaysRunPerWeek` | float | Rolling weekly frequency | ✓ |
| `averageDistancePerDay` | float | Rolling daily avg distance | — null |

---

### `GET /v1/my/activities` (per activity)

| Field | Type | Notes | Used |
|---|---|---|---|
| `activityId` | int | Unique activity ID | |
| `activityType` | string | `running`, `cycling`, etc. | ✓ (filter) |
| `startDateTimeLocal` | string | ISO 8601 local start time | ✓ (date bucketing) |
| `distance` | float | Distance (km) | ✓ (weekly/monthly totals) |
| `duration` | float | Duration (seconds) | |
| `heartRateAverage` | int | Average HR (bpm) | |
| `heartRateMax` | int | Max HR (bpm) | |
| `heartRateMin` | int | Min HR (bpm) | |
| `cadenceAverage` | int | Average cadence (spm) | |
| `cadenceMax` | int | Max cadence (spm) | |
| `cadenceMin` | int | Min cadence (spm) | |
| `calories` | float | Estimated calories | — null in some syncs |
| `temperature` | float | Ambient temp (°C) | ✓ |
| `temperatureApparent` | float | Feels-like temp (°C) | ✓ |
| `temperatureWindChill` | float | Wind chill (°C) | |
| `humidity` | int | Humidity (%) | ✓ |
| `windSpeed` | float | Wind speed (km/h) | ✓ |
| `weatherType` | string | e.g. `cloudy`, `clear` | ✓ |
| `terrain` | string | e.g. `road`, `trail`, `none` | |
| `isRace` | int | 1 if race | |
| `isTreadmill` | int | 1 if treadmill | |
| `howFelt` | string | Subjective feel label | |
| `notes` | string | Free-text run notes | |
| `source` | string | e.g. `garminhealth` | |
| `deviceType` | string | e.g. `Garmin` | |
| `externalId` | int | Garmin/Strava activity ID | |
| `startLatitude` / `startLongitude` | float | GPS start position | |
| `hasDetails` | int | 1 if lap data available | |
| `hasDetailsGPS` | int | 1 if GPS track available | |

---

## What is NOT available

| Metric | Reason |
|---|---|
| Critical Speed (CS) / D′ from activity fields | `eFTPSupported: false` — `ss_cp`, `icu_rolling_cp`, `icu_rolling_w_prime` always null; use athlete sport settings instead |
| Garmin body battery | Requires enabling Garmin Health Data under Intervals.icu → Connections → Garmin |
| Power metrics (NP, IF, TSS) | No running power meter |
| Nutrition / hydration | Not logged to either platform |
| Smashrun pace per activity | Not directly a field; derivable from `distance` ÷ `duration` |

## Recently Added Fields

| Field | Source | Notes |
|---|---|---|
| `hrvSDNN` | Intervals.icu wellness | Alternative HRV metric (SDNN variant) |
| `stress` / `readiness` | Intervals.icu wellness | Garmin all-day stress & training readiness (enable Garmin Health Data) |
| `weight` / `bodyFat` | Intervals.icu wellness | Body composition (sync from Garmin or manual entry) |
| `mood` / `motivation` / `fatigue` / `soreness` | Intervals.icu wellness | Subjective wellness scores (manual daily entry) |
| `comments` | Intervals.icu wellness | Free-text wellness notes |
| `total_elevation_gain` | Intervals.icu activities | Hill training load from latest activity |
| `average_cadence` / `max_heartrate` | Intervals.icu activities | Running form & intensity metrics |
| `icu_hr_zone_times` | Intervals.icu activities | Time in HR zones (z1-z5) |
| `icu_rpe` / `feel` | Intervals.icu activities | Perceived effort & feeling (1-10, 1-5) |
| `longestStreak` / `longestBreakBetweenRuns` | Smashrun stats | Consistency & gap tracking |
| `daysRunAM` / `daysRunPM` / `daysRunBoth` | Smashrun stats | Training time-of-day patterns |
| `averageDaysRunPerWeek` / `mostOftenRunOnDay` | Smashrun stats | Frequency metrics |
| `temperature` / `humidity` / `windSpeed` / `weatherType` | Smashrun activities | Weather conditions from latest run |
