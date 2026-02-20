"""Analytics and calculation utilities."""

import statistics


def calculate_consistency_score(
    volumes: list[float], rest_days: list[int], monotony_values: list[float]
) -> dict:
    """Calculate training consistency score (0-100)."""
    if not volumes:
        return {"score": None, "reason": "No volume data", "assessment": "N/A"}

    # Volume consistency (lower variance = higher score)
    try:
        mean_vol = statistics.mean(volumes)
        cv = statistics.stdev(volumes) / mean_vol if mean_vol > 0 else 1
        volume_score = max(0, min(100, 100 - (cv * 100)))
    except statistics.StatisticsError:
        volume_score = 50

    # Rest day regularity (ideal: 1-2 rest days per week)
    avg_rest = sum(rest_days) / len(rest_days) if rest_days else 7
    rest_score = max(0, min(100, 100 - abs(avg_rest - 1.5) * 30))

    # Monotony score (ideal: 1.0-1.5)
    avg_mono = sum(monotony_values) / len(monotony_values) if monotony_values else 2
    mono_score = max(0, min(100, 100 - abs(avg_mono - 1.25) * 50))

    # Overall score
    overall = int((volume_score * 0.4) + (rest_score * 0.3) + (mono_score * 0.3))

    return {
        "score": overall,
        "volume_score": int(volume_score),
        "rest_score": int(rest_score),
        "monotony_score": int(mono_score),
        "assessment": (
            "Excellent"
            if overall >= 80
            else "Good"
            if overall >= 60
            else "Fair"
            if overall >= 40
            else "Needs Work"
        ),
    }


def get_recommendation(
    tsb: float | None,
    hrv: float | None,
    resting_hr: int | None,
    sleep_score: float | None,
    fatigue: int | None,
) -> dict:
    """Get recovery/workout recommendation based on current state."""
    # High TSB deficit = overreaching
    if tsb is not None and tsb < -20:
        return {
            "recommendation": "🛑 REST DAY",
            "reason": (
                f"TSB is {tsb:.1f} - you're overreaching."
                " Take a rest day or very easy recovery run."
            ),
            "urgency": "high",
            "color": "red",
        }

    # High subjective fatigue
    if fatigue is not None and fatigue >= 4:
        return {
            "recommendation": "😴 EASY DAY",
            "reason": "High fatigue reported. Keep it conversational pace today.",
            "urgency": "medium",
            "color": "yellow",
        }

    # Poor sleep
    if sleep_score is not None and sleep_score < 60:
        return {
            "recommendation": "💤 RECOVERY FOCUS",
            "reason": f"Poor sleep ({sleep_score:.0f}/100). Prioritize recovery over intensity.",
            "urgency": "medium",
            "color": "yellow",
        }

    # Well recovered - go hard
    if tsb is not None and tsb > 10 and (hrv is None or hrv > 45):
        return {
            "recommendation": "🔥 GO FOR IT",
            "reason": f"TSB is {tsb:.1f} and you're well-recovered. Great day for a hard workout!",
            "urgency": "low",
            "color": "green",
        }

    # Balanced TSB = steady aerobic
    if tsb is not None and -10 <= tsb <= 10:
        return {
            "recommendation": "✅ STEADY RUN",
            "reason": f"TSB is {tsb:.1f} - balanced fatigue. Good for aerobic base miles.",
            "urgency": "low",
            "color": "blue",
        }

    # Default
    return {
        "recommendation": "🏃 EASY RUN",
        "reason": "Default recommendation: keep it easy and listen to your body.",
        "urgency": "low",
        "color": "blue",
    }


def calculate_projections(
    ctl: float, atl: float, ramp_rate: float | None
) -> tuple[list[dict], int | None]:
    """Project fitness/fatigue for next 7 days.

    Returns:
        (projections list, days_to_positive_tsb or None if already positive / never reached)

    """
    current_tsb = ctl - atl
    already_positive = current_tsb > 0

    projections = []
    days_to_positive: int | None = None

    for day in range(1, 8):
        proj_ctl = ctl + (ramp_rate or 0) * (day / 7)
        proj_atl = atl * (0.9**day)  # ATL decays ~10% per day if no training
        proj_tsb = proj_ctl - proj_atl
        projections.append(
            {
                "day": day,
                "ctl": round(proj_ctl, 1),
                "atl": round(proj_atl, 1),
                "tsb": round(proj_tsb, 1),
                "zone": ("Optimal" if proj_tsb > 5 else "Grey" if proj_tsb > -10 else "Overreach"),
            }
        )
        if days_to_positive is None and not already_positive and proj_tsb > 0:
            days_to_positive = day

    return projections, (None if already_positive else days_to_positive)


def calculate_detraining(ctl: float, atl: float, weeks: int = 6) -> list[dict]:
    """Project CTL/ATL/TSB decay if training stops today.

    Uses standard time constants: CTL τ=42 days, ATL τ=7 days.
    Returns one data point per week (days 0, 7, 14, ... weeks*7).
    """
    points = []
    for w in range(weeks + 1):
        d = w * 7
        # Exponential decay: x(t) = x0 * (1 - 1/τ)^t
        decay_ctl = (1 - 1 / 42) ** d
        decay_atl = (1 - 1 / 7) ** d
        proj_ctl = round(ctl * decay_ctl, 1)
        proj_atl = round(atl * decay_atl, 1)
        proj_tsb = round(proj_ctl - proj_atl, 1)
        pct_ctl_lost = round((1 - decay_ctl) * 100, 1)
        points.append(
            {
                "week": w,
                "ctl": proj_ctl,
                "atl": proj_atl,
                "tsb": proj_tsb,
                "ctl_pct_lost": pct_ctl_lost,
            }
        )
    return points


def calculate_weekly_summary(rows: list[tuple]) -> dict:
    """Summarise the most recent 7-day period vs the 7 days before it.

    rows columns (ordered): ctl, atl, tsb, hrv, week_0_km, rest_days
    rows[0] = most recent, rows[-1] = oldest.
    Expects at least 2 rows for delta calculation (ideally 14).
    """
    if not rows:
        return {
            "ctl_change": None,
            "total_km": None,
            "avg_hrv": None,
            "rest_days": None,
            "tsb_trend": "unknown",
            "message": "No data available",
        }

    recent = rows[:7]
    previous = rows[7:14] if len(rows) >= 14 else []

    # CTL change: latest vs oldest in the window (or vs previous week's latest)
    ctls = [r[0] for r in recent if r[0] is not None]
    ctl_change: float | None = None
    if ctls:
        if previous:
            prev_ctls = [r[0] for r in previous if r[0] is not None]
            if prev_ctls:
                ctl_change = round(ctls[0] - prev_ctls[0], 1)
        elif len(ctls) >= 2:
            ctl_change = round(ctls[0] - ctls[-1], 1)

    # Weekly km: use the most recent week_0_km snapshot
    week_kms = [r[4] for r in recent if r[4] is not None]
    total_km = round(week_kms[0], 1) if week_kms else None

    # Avg HRV
    hrvs = [r[3] for r in recent if r[3] is not None]
    avg_hrv: float | None = round(sum(hrvs) / len(hrvs), 1) if hrvs else None

    # Rest days (most recent snapshot value)
    rest_vals = [r[5] for r in recent if r[5] is not None]
    rest_days = rest_vals[0] if rest_vals else None

    # TSB trend
    tsbs = [r[2] for r in recent if r[2] is not None]
    if len(tsbs) >= 3:
        recent_tsb = sum(tsbs[:3]) / 3
        older_tsb = sum(tsbs[-3:]) / 3
        if recent_tsb > older_tsb + 2:
            tsb_trend = "improving"
        elif recent_tsb < older_tsb - 2:
            tsb_trend = "declining"
        else:
            tsb_trend = "stable"
    else:
        tsb_trend = "stable"

    # Human-readable message
    parts = []
    if ctl_change is not None:
        arrow = "+" if ctl_change >= 0 else ""
        parts.append(f"{arrow}{ctl_change} CTL")
    if total_km is not None:
        parts.append(f"{total_km} km")
    if avg_hrv is not None:
        parts.append(f"HRV {avg_hrv}")
    if rest_days is not None:
        parts.append(f"{rest_days} rest day{'s' if rest_days != 1 else ''}")
    message = " · ".join(parts) if parts else "Keep logging data"

    return {
        "ctl_change": ctl_change,
        "total_km": total_km,
        "avg_hrv": avg_hrv,
        "rest_days": rest_days,
        "tsb_trend": tsb_trend,
        "message": message,
    }


def calculate_goal_adherence(weekly_km_target: float, snapshot_rows: list[tuple]) -> dict:
    """Calculate adherence to a weekly km goal over the last 8 weeks.

    snapshot_rows columns: recorded_at (ISO str), week_0_km
    Returns per-week achieved/target and overall adherence %.
    """
    from datetime import datetime, timedelta

    if not snapshot_rows:
        return {
            "target_km": weekly_km_target,
            "overall_pct": None,
            "streak": 0,
            "weeks": [],
            "message": "No data available",
        }

    # Group snapshots by ISO week (Monday-based)
    week_data: dict[str, list[float]] = {}
    for row in snapshot_rows:
        recorded_at_str, week_km = row[0], row[1]
        if week_km is None:
            continue
        try:
            dt = datetime.fromisoformat(recorded_at_str)
        except ValueError:
            continue
        # ISO week start (Monday)
        week_start = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
        week_data.setdefault(week_start, []).append(week_km)

    # Take the max week_0_km per week (most recent fetch that week is most accurate)
    weeks_sorted = sorted(week_data.keys(), reverse=True)[:8]

    week_results = []
    for ws in weeks_sorted:
        actual_km = max(week_data[ws])
        achieved = actual_km >= weekly_km_target
        week_results.append(
            {
                "week_start": ws,
                "planned_km": weekly_km_target,
                "actual_km": round(actual_km, 1),
                "achieved": achieved,
            }
        )

    if not week_results:
        return {
            "target_km": weekly_km_target,
            "overall_pct": None,
            "streak": 0,
            "weeks": [],
            "message": "Not enough weekly data",
        }

    achieved_count = sum(1 for w in week_results if w["achieved"])
    overall_pct = round(achieved_count / len(week_results) * 100)

    # Current streak (consecutive achieved weeks from most recent)
    streak = 0
    for w in week_results:
        if w["achieved"]:
            streak += 1
        else:
            break

    return {
        "target_km": weekly_km_target,
        "overall_pct": overall_pct,
        "streak": streak,
        "weeks": week_results,
        "message": f"Hit goal {achieved_count}/{len(week_results)} weeks ({overall_pct}%)",
    }


def calculate_injury_risk(rows: list[tuple]) -> dict:
    """Calculate injury risk score based on multiple factors."""
    if len(rows) < 7:
        return {
            "risk_score": None,
            "risk_level": "unknown",
            "message": "Not enough data for risk assessment",
            "factors": [],
            "recommendations": [],
        }

    latest = rows[0]
    ctl, atl, ramp_rate, ac_ratio, rest_days, hrv, sleep_score, fatigue = latest

    risk_factors = []
    risk_score = 0

    # Factor 1: Ramp rate
    if ramp_rate is not None:
        if ramp_rate > 8:
            risk_score += 30
            risk_factors.append(
                {
                    "factor": "Extreme ramp rate",
                    "value": f"+{ramp_rate:.1f}/week",
                    "severity": "high",
                    "message": "Fitness increasing too rapidly. High injury risk.",
                }
            )
        elif ramp_rate > 5:
            risk_score += 20
            risk_factors.append(
                {
                    "factor": "High ramp rate",
                    "value": f"+{ramp_rate:.1f}/week",
                    "severity": "medium",
                    "message": "Above safe ramp rate (>2-3/week recommended)",
                }
            )
        elif ramp_rate > 3:
            risk_score += 10
            risk_factors.append(
                {
                    "factor": "Elevated ramp rate",
                    "value": f"+{ramp_rate:.1f}/week",
                    "severity": "low",
                    "message": "Monitor for fatigue buildup",
                }
            )

    # Factor 2: A:C ratio
    if ac_ratio is not None:
        if ac_ratio > 1.5:
            risk_score += 25
            risk_factors.append(
                {
                    "factor": "Very high fatigue load",
                    "value": f"{ac_ratio:.2f}",
                    "severity": "high",
                    "message": "ATL >50% above CTL. Take rest immediately.",
                }
            )
        elif ac_ratio > 1.3:
            risk_score += 15
            risk_factors.append(
                {
                    "factor": "High fatigue load",
                    "value": f"{ac_ratio:.2f}",
                    "severity": "medium",
                    "message": "Fatigue exceeding fitness base",
                }
            )

    # Factor 3: Rest days pattern
    rest_days_list = [r[4] for r in rows[:7] if r[4] is not None]
    avg_rest = 0
    if rest_days_list:
        avg_rest = sum(rest_days_list) / len(rest_days_list)
        if avg_rest < 0.5:
            risk_score += 15
            risk_factors.append(
                {
                    "factor": "Insufficient rest",
                    "value": f"{avg_rest:.1f} days/week",
                    "severity": "medium",
                    "message": "Too few rest days. Schedule at least 1-2 per week.",
                }
            )
        elif avg_rest > 4:
            risk_score += 10
            risk_factors.append(
                {
                    "factor": "Inconsistent training",
                    "value": f"{avg_rest:.1f} days/week",
                    "severity": "low",
                    "message": "Long rest periods increase injury risk on return",
                }
            )

    # Factor 4: HRV trend
    hrv_values = [r[5] for r in rows[:7] if r[5] is not None]
    if len(hrv_values) >= 3:
        recent_avg = sum(hrv_values[:3]) / 3
        older_avg = sum(hrv_values[-3:]) / 3
        hrv_change = ((recent_avg - older_avg) / older_avg) * 100 if older_avg > 0 else 0

        if hrv_change < -15:
            risk_score += 20
            risk_factors.append(
                {
                    "factor": "Significant HRV drop",
                    "value": f"{hrv_change:.0f}%",
                    "severity": "high",
                    "message": "Autonomic stress elevated. Prioritize recovery.",
                }
            )
        elif hrv_change < -10:
            risk_score += 10
            risk_factors.append(
                {
                    "factor": "HRV declining",
                    "value": f"{hrv_change:.0f}%",
                    "severity": "medium",
                    "message": "Monitor stress levels",
                }
            )

    # Factor 5: Poor sleep
    if sleep_score is not None and sleep_score < 60:
        risk_score += 10
        risk_factors.append(
            {
                "factor": "Poor sleep recovery",
                "value": f"{sleep_score:.0f}/100",
                "severity": "medium",
                "message": "Inadequate recovery reduces injury resilience",
            }
        )

    # Factor 6: Self-reported fatigue
    if fatigue is not None and fatigue >= 4:
        risk_score += 15
        risk_factors.append(
            {
                "factor": "High subjective fatigue",
                "value": f"{fatigue}/5",
                "severity": "high",
                "message": "You reported high fatigue. Listen to your body.",
            }
        )

    # Determine risk level
    if risk_score >= 60:
        risk_level = "high"
        message = "🔴 HIGH INJURY RISK: Multiple warning signs. Take rest days immediately."
    elif risk_score >= 40:
        risk_level = "elevated"
        message = "🟠 ELEVATED RISK: Several factors concerning. Reduce intensity/volume."
    elif risk_score >= 20:
        risk_level = "moderate"
        message = "🟡 MODERATE RISK: Some warning signs. Monitor closely."
    else:
        risk_level = "low"
        message = "🟢 LOW RISK: Training load appears sustainable."

    return {
        "risk_score": min(100, risk_score),
        "risk_level": risk_level,
        "message": message,
        "factors": risk_factors,
        "recommendations": [
            "Reduce volume by 20-30%" if risk_score >= 40 else "Maintain current load",
            "Prioritize sleep (>7 hours)" if sleep_score and sleep_score < 70 else None,
            "Add 1-2 rest days this week" if avg_rest < 1 else None,
            "Monitor HRV daily" if hrv_values and len(hrv_values) > 0 else None,
        ],
    }


def calculate_race_predictions(
    cs: float, d_prime: float | None, ctl: float | None, avg_pace: str | None
) -> list[dict]:
    """Predict race times based on critical speed model."""
    distances = [
        ("800m", 800, "2:00-2:30"),
        ("1 mile", 1609, "4:30-6:00"),
        ("5K", 5000, "15:00-25:00"),
        ("10K", 10000, "32:00-55:00"),
        ("Half Marathon", 21097, "1:10-2:30"),
        ("Marathon", 42195, "2:30-5:00"),
    ]

    predictions = []
    for name, meters, typical_range in distances:
        if cs <= 0:
            continue

        # Simplified critical speed model
        if meters < 2000:
            # Short distance - D' plays bigger role
            t = meters / cs
            for _ in range(3):  # 3 iterations for convergence
                v = cs + (d_prime or 0) / t if t > 0 else cs
                t = meters / v if v > 0 else t
        else:
            # Longer distance - CS dominant
            effective_d = min(d_prime or 0, meters * 0.1)  # D' contribution diminishes
            t = (meters - effective_d * 0.5) / cs

        if t <= 0:
            continue

        # Convert to pace and time
        pace_sec_per_km = (t / meters) * 1000
        pace_min = int(pace_sec_per_km // 60)
        pace_sec = int(pace_sec_per_km % 60)

        total_min = int(t // 60)
        total_sec = int(t % 60)
        if total_min >= 60:
            h = total_min // 60
            m = total_min % 60
            time_str = f"{h}:{m:02d}:{total_sec:02d}"
        else:
            time_str = f"{total_min}:{total_sec:02d}"

        predictions.append(
            {
                "distance": name,
                "meters": meters,
                "predicted_time": time_str,
                "predicted_pace": f"{pace_min}:{pace_sec:02d}/km",
                "typical_range": typical_range,
            }
        )

    return predictions
