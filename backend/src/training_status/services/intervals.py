"""Intervals.icu API client."""

import logging
from datetime import date, datetime, timedelta
from typing import Any, cast

import requests

logger = logging.getLogger(__name__)

from ..config import Settings

# Standard race distances for PR detection: (label, target_meters)
_PR_DISTANCES = [
    ("800m", 800),
    ("1 Mile", 1609),
    ("5K", 5000),
    ("10K", 10000),
    ("Half Marathon", 21097),
    ("Marathon", 42195),
]
_PR_TOLERANCE = 0.08  # ±8% distance tolerance


def extract_pr_candidates(activities: list[dict]) -> list[dict]:
    """Find run activities that match standard race distances (±8%).

    Returns a list of dicts with keys: distance_label, distance_m, time_secs,
    pace_str, activity_date, activity_id.
    """
    candidates = []
    for act in activities:
        if act.get("type", "").lower() not in ("run", "virtualrun", "treadmill"):
            continue
        distance_m = act.get("distance")
        moving_time = act.get("moving_time") or act.get("elapsed_time")
        if not distance_m or not moving_time or moving_time <= 0:
            continue

        activity_date = str(act.get("start_date_local", ""))[:10]
        activity_id = str(act.get("id", ""))

        for label, target_m in _PR_DISTANCES:
            if abs(distance_m - target_m) / target_m <= _PR_TOLERANCE:
                pace_sec_km = (moving_time / distance_m) * 1000
                pace_min = int(pace_sec_km // 60)
                pace_sec_part = int(pace_sec_km % 60)
                pace_str = f"{pace_min}:{pace_sec_part:02d}/km"
                candidates.append(
                    {
                        "distance_label": label,
                        "distance_m": target_m,
                        "time_secs": float(moving_time),
                        "pace_str": pace_str,
                        "activity_date": activity_date,
                        "activity_id": activity_id,
                    }
                )
                break  # each activity matches at most one standard distance

    return candidates


class IntervalsClient:
    """Client for Intervals.icu API."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.auth = ("API_KEY", settings.intervals_api_key)
        self.base_url = f"https://intervals.icu/api/v1/athlete/{settings.intervals_id}"

    def _get(self, endpoint: str, params: dict | None = None, timeout: int = 10) -> dict:
        """Make authenticated GET request."""
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, auth=self.auth, params=params, timeout=timeout)
        response.raise_for_status()
        return cast(dict, response.json())

    def get_athlete_max_hr(self) -> int | None:
        """Fetch the athlete's physiological maximum heart rate from their profile.

        Intervals.icu stores this as `maxHR` on the athlete object.
        Falls back to a 220-age estimate if the profile has a date_of_birth.
        """
        try:
            profile = self._get("")  # GET /athlete/{id}
            max_hr = profile.get("maxHR") or profile.get("max_hr")
            if max_hr:
                return int(max_hr)
            # Fallback: 220 - age estimate
            dob = profile.get("dob") or profile.get("date_of_birth")
            if dob:
                birth_year = int(str(dob)[:4])
                age = date.today().year - birth_year
                return 220 - age
        except Exception:
            pass
        return None

    def get_wellness(self) -> dict[str, Any]:
        """Get wellness data from Intervals.icu.

        Returns training load, HRV, sleep, and other health metrics.
        """
        raw: dict[str, Any] = {"wellness": {}, "pace_curves": {}, "activities": []}

        # Fetch athlete profile max HR (physiological, not per-activity)
        athlete_max_hr = self.get_athlete_max_hr()

        # Get wellness data
        wellness_list = self._get("wellness")
        if not wellness_list:
            raise RuntimeError("No wellness data returned")

        latest = wellness_list[-1]
        raw["wellness"] = latest

        # Extract core metrics
        ctl = latest.get("ctl") or 0
        atl = latest.get("atl") or 0
        ramp_rate = latest.get("rampRate") or 0

        result = {
            "ctl": round(ctl, 2),
            "atl": round(atl, 2),
            "tsb": round(ctl - atl, 2),
            "ramp_rate": round(ramp_rate, 4),
            "ac_ratio": round(atl / ctl, 2) if ctl else None,
            "resting_hr": latest.get("restingHR"),
            "hrv": latest.get("hrv"),
            "hrv_sdnn": latest.get("hrvSDNN"),
            "sleep_secs": latest.get("sleepSecs"),
            "sleep_quality": latest.get("sleepQuality"),
            "vo2max": latest.get("vo2max"),
            "sleep_score": latest.get("sleepScore"),
            "steps": latest.get("steps"),
            "spo2": latest.get("spO2"),
            # Wellness fields
            "stress": latest.get("stress"),
            "readiness": latest.get("readiness"),
            "weight": latest.get("weight"),
            "body_fat": latest.get("bodyFat"),
            "mood": latest.get("mood"),
            "motivation": latest.get("motivation"),
            "fatigue": latest.get("fatigue"),
            "soreness": latest.get("soreness"),
            "comments": latest.get("comments"),
            "respiratory_rate": latest.get("respirationRate"),
        }

        # VO2max fallback - search history for most recent non-null value
        if result["vo2max"] is None:
            for entry in reversed(wellness_list):
                if entry.get("vo2max") is not None:
                    result["vo2max"] = entry["vo2max"]
                    break

        # Critical Speed calculation
        result.update(self._calculate_critical_speed(raw))

        # Activity data for rest days, monotony, strain
        result.update(self._get_activity_metrics(raw, athlete_max_hr))

        result["_raw"] = raw
        return result

    def _calculate_critical_speed(self, raw: dict) -> dict[str, float | None]:
        """Calculate Critical Speed and D' from pace curves."""
        cs_oldest = (datetime.now() - timedelta(days=42)).strftime("%Y-%m-%d")
        cs_newest = datetime.now().strftime("%Y-%m-%d")

        try:
            pc = self._get(
                "activity-pace-curves",
                params={"oldest": cs_oldest, "newest": cs_newest, "type": "Run"},
            )
        except requests.HTTPError:
            return {"critical_speed": None, "d_prime": None}

        dists = pc.get("distances", [])
        curves = pc.get("curves", [])

        if not dists or not curves:
            return {"critical_speed": None, "d_prime": None}

        # Build best (min) time per distance across all activities
        best_t: dict[float, float] = {}
        for curve in curves:
            for d, t in zip(dists, curve.get("secs", [])):
                if t and (d not in best_t or t < best_t[d]):
                    best_t[d] = t

        # Use standard 1k-5k distances; keep only efforts ≥ 2 min
        target_m = [1000.0, 2000.0, 3000.0, 4000.0, 5000.0]
        pts = []
        for td in target_m:
            if not dists:
                continue
            closest = min(dists, key=lambda x: abs(x - td))
            t = best_t.get(closest)
            if t and t >= 120:
                pts.append((t, closest))

        if len(pts) >= 2:
            xs = [1 / t for t, _ in pts]
            ys = [d / t for t, d in pts]
            n = len(pts)
            sx, sy = sum(xs), sum(ys)
            sxx = sum(x * x for x in xs)
            sxy = sum(x * y for x, y in zip(xs, ys))

            denominator = n * sxx - sx * sx
            if denominator != 0:
                dp_fit = (n * sxy - sx * sy) / denominator
                cs_fit = (sy - dp_fit * sx) / n

                if cs_fit > 0:
                    raw["pace_curves"] = {"n_activities": len(curves), "points_used": pts}
                    cs_rounded = round(cs_fit, 4)
                    dp_rounded = round(dp_fit, 2)
                    logger.info(
                        "Critical Speed updated: CS=%.2f m/s, D'=%.1fm (from %d activities, %d points)",
                        cs_rounded, dp_rounded, len(curves), len(pts),
                    )
                    return {"critical_speed": cs_rounded, "d_prime": dp_rounded}

        return {"critical_speed": None, "d_prime": None}

    def _get_activity_metrics(self, raw: dict, athlete_max_hr: int | None = None) -> dict[str, Any]:
        """Calculate metrics from recent activities."""
        import statistics

        today_str = datetime.now().strftime("%Y-%m-%d")
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        try:
            acts = self._get("activities", params={"oldest": week_ago, "newest": today_str})
        except requests.HTTPError:
            return {
                "rest_days": None,
                "monotony": None,
                "training_strain": None,
                "elevation_gain_m": None,
                "avg_cadence": None,
                "max_hr": None,
                "hr_zone_z1_secs": None,
                "hr_zone_z2_secs": None,
                "hr_zone_z3_secs": None,
                "hr_zone_z4_secs": None,
                "hr_zone_z5_secs": None,
                "icu_rpe": None,
                "feel": None,
            }

        raw["activities"] = acts
        # Check for personal records in fetched activities
        raw["pr_candidates"] = extract_pr_candidates(acts if isinstance(acts, list) else [])

        result: dict[str, Any] = {
            "rest_days": None,
            "monotony": None,
            "training_strain": None,
            "elevation_gain_m": None,
            "avg_cadence": None,
            "max_hr": None,
            "hr_zone_z1_secs": None,
            "hr_zone_z2_secs": None,
            "hr_zone_z3_secs": None,
            "hr_zone_z4_secs": None,
            "hr_zone_z5_secs": None,
            "icu_rpe": None,
            "feel": None,
        }

        if not acts:
            return result

        # Rest days since last activity
        last_d = date.fromisoformat(acts[0]["start_date_local"][:10])
        result["rest_days"] = (date.today() - last_d).days

        # Extract metrics from most recent activity
        latest = acts[0]
        result["elevation_gain_m"] = latest.get("total_elevation_gain")
        result["avg_cadence"] = latest.get("average_cadence")
        # athlete_max_hr is the athlete's configured physiological max HR in Intervals.icu
        # (distinct from a single workout's peak). Use it for Karvonen zone calculations.
        result["max_hr"] = latest.get("athlete_max_hr") or latest.get("max_heartrate")
        # Store the configured HR zone boundaries for direct use in zone display
        result["icu_hr_zones"] = latest.get("icu_hr_zones") or []
        result["icu_rpe"] = latest.get("icu_rpe")
        result["feel"] = latest.get("feel")

        # Heart rate zone times
        hr_zones = latest.get("icu_hr_zone_times", [])
        if hr_zones and len(hr_zones) >= 5:
            result["hr_zone_z1_secs"] = hr_zones[0]
            result["hr_zone_z2_secs"] = hr_zones[1]
            result["hr_zone_z3_secs"] = hr_zones[2]
            result["hr_zone_z4_secs"] = hr_zones[3]
            result["hr_zone_z5_secs"] = hr_zones[4]

        # Calculate monotony and training strain
        load_by_day: dict[str, float] = {}
        for a in acts:
            d = a["start_date_local"][:10]
            load_by_day[d] = load_by_day.get(d, 0) + (a.get("icu_training_load") or 0)

        daily_loads = [
            load_by_day.get((date.today() - timedelta(days=i)).isoformat(), 0) for i in range(7)
        ]

        if len(daily_loads) > 1 and statistics.stdev(daily_loads) > 0:
            mono = statistics.mean(daily_loads) / statistics.stdev(daily_loads)
            result["monotony"] = round(mono, 2)
            result["training_strain"] = round(sum(daily_loads) * mono)

        return result
