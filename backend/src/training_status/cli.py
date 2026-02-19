"""CLI entry point for fetching and displaying training status."""

import json
import statistics
from datetime import date, datetime, timedelta
from pathlib import Path

from .config import get_settings
from .database import get_db
from .services.intervals import IntervalsClient
from .services.smashrun import SmashrunClient


# --- DISPLAY HELPERS ---

def ctl_label(ramp_rate: float) -> str:
    if ramp_rate > 2:
        return "good"
    elif ramp_rate >= 0:
        return "ok"
    return "bad"


def atl_label(atl: float, ctl: float) -> str:
    ratio = atl / ctl if ctl else 0
    if ratio < 1.0:
        return "good"
    elif ratio <= 1.3:
        return "ok"
    return "bad"


def tsb_zone(tsb: float) -> str:
    if tsb > 25:
        return "Transition"
    elif tsb > 5:
        return "Fresh"
    elif tsb > -10:
        return "Grey Zone"
    elif tsb > -30:
        return "Overreaching"
    return "Very Overreached"


def tsb_label(tsb: float) -> str:
    if tsb > 5:
        return "good"
    elif tsb > -10:
        return "ok"
    return "bad"


def ac_label(ratio: float) -> str:
    if ratio < 0.8:
        return "bad"
    elif ratio <= 1.3:
        return "good"
    elif ratio <= 1.5:
        return "ok"
    return "bad"


def fmt_sleep(secs: int) -> str:
    h, m = int(secs // 3600), int((secs % 3600) // 60)
    return f"{h}h{m:02d}m"


# --- DISPLAY FORMATTERS ---

def display_intervals(iv: dict) -> dict:
    """Format Intervals.icu data for display."""
    ctl = iv.get("ctl", 0)
    atl = iv.get("atl", 0)
    tsb = iv.get("tsb", 0)
    ac = iv.get("ac_ratio")
    rr = iv.get("ramp_rate", 0)
    
    lines = {
        "Fitness (CTL)": f"{ctl}  ({ctl_label(rr)})",
        "Fatigue (ATL)": f"{atl}  ({atl_label(atl, ctl)})",
        "Stress Balance (TSB)": f"{tsb}  ({tsb_label(tsb)}) — {tsb_zone(tsb)}",
        "Workload Ratio (A:C)": f"{ac}  ({ac_label(ac)})" if ac else "N/A",
    }
    
    if iv.get("resting_hr"):
        lines["Resting HR"] = f"{iv['resting_hr']} bpm"
    if iv.get("hrv"):
        lines["HRV"] = f"{round(iv['hrv'])} ms"
    if iv.get("sleep_secs"):
        quality_map = {1: "Good", 2: "OK", 3: "Bad"}
        q = quality_map.get(iv.get("sleep_quality"), "")
        score = f"  score {round(iv['sleep_score'])}/100" if iv.get("sleep_score") else ""
        lines["Sleep"] = f"{q + ' / ' if q else ''}{fmt_sleep(iv['sleep_secs'])}{score}"
    if iv.get("vo2max") is not None:
        lines["VO2max"] = iv["vo2max"]
    if iv.get("steps") is not None:
        lines["Steps"] = iv["steps"]
    if iv.get("spo2") is not None:
        lines["SpO2"] = f"{iv['spo2']}%"
    if iv.get("rest_days") is not None:
        lines["Rest Days"] = iv["rest_days"]
    if iv.get("monotony") is not None:
        lines["Monotony"] = iv["monotony"]
        lines["Training Strain"] = iv["training_strain"]
    
    return lines


def display_smashrun(sr: dict) -> dict:
    """Format Smashrun data for display."""
    lines = {
        "Total Distance (km)": sr["total_distance_km"],
        "Run Count (Total)": sr["run_count"],
        "Longest Run (km)": sr["longest_run_km"],
        "Avg Pace": sr["avg_pace"],
    }
    
    lines["This week km"] = sr.get("week_0_km", 0)
    for i in range(1, 5):
        label = sr.get(f"week_{i}_label", f"Week -{i}")
        lines[f"Week {i} ({label}) km"] = sr.get(f"week_{i}_km", 0)
    
    lines[f"Last Month ({sr['last_month_label']}) km"] = sr["last_month_km"]
    return lines


def print_history(db):
    """Print recent history table."""
    rows = db.get_history(days=7)
    
    if not rows:
        return
    
    print("\n[History — last 7 records]")
    header = (
        f"  {'Date/Time':<20} {'CTL':>5} {'ATL':>5} {'TSB':>5} {'A:C':>5}"
        f" {'HR':>4} {'HRV':>5} {'W0km':>6} {'W1km':>6} {'W2km':>6} {'W3km':>6} {'W4km':>6} {'Mokm':>7}"
    )
    print(header)
    print("  " + "-" * (len(header) - 2))
    
    for r in rows:
        recorded_at, ctl, atl, tsb, ac, hr, hrv, w0, w1, w2, w3, w4, mo = r
        print(
            f"  {str(recorded_at):<20}"
            f" {(ctl or 0):>5.1f}"
            f" {(atl or 0):>5.1f}"
            f" {(tsb or 0):>5.1f}"
            f" {(ac or 0):>5.2f}"
            f" {(hr or 0):>4}"
            f" {(hrv or 0):>5.0f}"
            f" {(w0 or 0):>6.1f}"
            f" {(w1 or 0):>6.1f}"
            f" {(w2 or 0):>6.1f}"
            f" {(w3 or 0):>6.1f}"
            f" {(w4 or 0):>6.1f}"
            f" {(mo or 0):>7.2f}"
        )


def prepare_snapshot_data(iv: dict, sr: dict) -> dict:
    """Prepare data for database insertion."""
    return {
        "recorded_at": datetime.now().isoformat(timespec="seconds"),
        "ctl": iv.get("ctl"),
        "atl": iv.get("atl"),
        "tsb": iv.get("tsb"),
        "ramp_rate": iv.get("ramp_rate"),
        "ac_ratio": iv.get("ac_ratio"),
        "resting_hr": iv.get("resting_hr"),
        "hrv": iv.get("hrv"),
        "hrv_sdnn": iv.get("hrv_sdnn"),
        "sleep_secs": iv.get("sleep_secs"),
        "sleep_quality": iv.get("sleep_quality"),
        "rest_days": iv.get("rest_days"),
        "monotony": iv.get("monotony"),
        "training_strain": iv.get("training_strain"),
        "vo2max": iv.get("vo2max"),
        "sleep_score": iv.get("sleep_score"),
        "steps": iv.get("steps"),
        "spo2": iv.get("spo2"),
        "stress": iv.get("stress"),
        "readiness": iv.get("readiness"),
        "weight": iv.get("weight"),
        "body_fat": iv.get("body_fat"),
        "mood": iv.get("mood"),
        "motivation": iv.get("motivation"),
        "fatigue": iv.get("fatigue"),
        "soreness": iv.get("soreness"),
        "comments": iv.get("comments"),
        "elevation_gain_m": iv.get("elevation_gain_m"),
        "avg_cadence": iv.get("avg_cadence"),
        "max_hr": iv.get("max_hr"),
        "hr_zone_z1_secs": iv.get("hr_zone_z1_secs"),
        "hr_zone_z2_secs": iv.get("hr_zone_z2_secs"),
        "hr_zone_z3_secs": iv.get("hr_zone_z3_secs"),
        "hr_zone_z4_secs": iv.get("hr_zone_z4_secs"),
        "hr_zone_z5_secs": iv.get("hr_zone_z5_secs"),
        "icu_rpe": iv.get("icu_rpe"),
        "feel": iv.get("feel"),
        "critical_speed": iv.get("critical_speed"),
        "d_prime": iv.get("d_prime"),
        "total_distance_km": sr.get("total_distance_km"),
        "run_count": sr.get("run_count"),
        "longest_run_km": sr.get("longest_run_km"),
        "avg_pace": sr.get("avg_pace"),
        "week_0_km": sr.get("week_0_km"),
        "week_1_km": sr.get("week_1_km"),
        "week_2_km": sr.get("week_2_km"),
        "week_3_km": sr.get("week_3_km"),
        "week_4_km": sr.get("week_4_km"),
        "last_month_km": sr.get("last_month_km"),
        "longest_streak": sr.get("longest_streak"),
        "longest_streak_date": sr.get("longest_streak_date"),
        "longest_break_days": sr.get("longest_break_days"),
        "longest_break_date": sr.get("longest_break_date"),
        "avg_days_run_per_week": sr.get("avg_days_run_per_week"),
        "days_run_am": sr.get("days_run_am"),
        "days_run_pm": sr.get("days_run_pm"),
        "days_run_both": sr.get("days_run_both"),
        "most_often_run_day": sr.get("most_often_run_day"),
        "weather_temp": sr.get("weather_temp"),
        "weather_temp_feels_like": sr.get("weather_temp_feels_like"),
        "weather_humidity": sr.get("weather_humidity"),
        "weather_wind_speed": sr.get("weather_wind_speed"),
        "weather_type": sr.get("weather_type"),
        "intervals_json": json.dumps(iv.get("_raw", {})),
        "smashrun_json": json.dumps(sr.get("_raw", {})),
    }


def generate_report():
    """Generate and display training status report."""
    print(f"--- Fitness Status Report ({datetime.now().strftime('%Y-%m-%d %H:%M')}) ---")
    
    settings = get_settings()
    
    # Fetch from Intervals.icu
    print("\nFetching Intervals.icu...", end=" ", flush=True)
    try:
        intervals_client = IntervalsClient(settings)
        iv = intervals_client.get_wellness()
        print("ok")
    except Exception as e:
        iv = {}
        print(f"ERROR: {e}")
    
    # Fetch from Smashrun
    print("Fetching Smashrun...", end=" ", flush=True)
    try:
        smashrun_client = SmashrunClient(settings)
        sr = smashrun_client.get_stats()
        print("ok")
    except Exception as e:
        sr = {}
        print(f"ERROR: {e}")
    
    # Display Intervals.icu data
    print("\n[Intervals.icu - Training Load & Health]")
    for key, val in display_intervals(iv).items():
        print(f"  {key}: {val}")
    
    # Display Smashrun data
    print("\n[Smashrun - Running Totals]")
    for key, val in display_smashrun(sr).items():
        print(f"  {key}: {val}")
    
    # Save to database
    db = get_db()
    if iv and sr:
        data = prepare_snapshot_data(iv, sr)
        db.insert_snapshot(data)
        print(f"\nSnapshot saved to {settings.db_path}")
    
    print_history(db)
    
    # Export to text file
    filename = "training_status.txt"
    with open(filename, "w") as f:
        f.write(f"DAILY STATUS: {datetime.now()}\n" + "=" * 30 + "\n")
        f.write(f"Intervals Data: {json.dumps({k: v for k, v in iv.items() if k != '_raw'})}\n")
        f.write(f"Smashrun Data:  {json.dumps({k: v for k, v in sr.items() if k != '_raw'})}\n")
    print(f"Report exported to {filename}")


if __name__ == "__main__":
    generate_report()
