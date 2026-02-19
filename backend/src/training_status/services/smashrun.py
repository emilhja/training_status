"""Smashrun API client."""

from datetime import date, timedelta
from typing import Any, Optional

import requests

from ..config import Settings


class SmashrunClient:
    """Client for Smashrun API."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.headers = {"Authorization": f"Bearer {settings.smashrun_token}"}
        self.base_url = "https://api.smashrun.com/v1"
    
    def _get(self, endpoint: str, timeout: int = 15) -> dict:
        """Make authenticated GET request."""
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, timeout=timeout)
        if response.status_code in (401, 403):
            raise PermissionError(
                f"Smashrun token rejected (HTTP {response.status_code}). "
                "The bearer token is temporary and will expire. "
                "Refresh it at https://api.smashrun.com/explorer → Connect, "
                "then copy the new access_token into your .env file."
            )
        response.raise_for_status()
        return response.json()
    
    def get_stats(self) -> dict[str, Any]:
        """Get running statistics from Smashrun.
        
        Returns lifetime stats, weekly totals, and activity data.
        """
        raw: dict[str, Any] = {"stats": {}, "activities": []}
        
        # Get lifetime stats
        stats = self._get("my/stats")
        raw["stats"] = stats
        
        today = date.today()
        
        # Calculate week boundaries
        days_since_monday = today.weekday()
        this_week_mon = today - timedelta(days=days_since_monday)
        
        # Build 4 previous calendar week ranges (Mon-Sun)
        weeks = []
        for i in range(1, 5):
            mon = today - timedelta(days=days_since_monday + 7 * i)
            sun = mon + timedelta(days=6)
            weeks.append((mon, sun))
        
        # Last calendar month
        first_this = today.replace(day=1)
        last_mo_end = first_this - timedelta(days=1)
        last_mo_start = last_mo_end.replace(day=1)
        
        # Get activities
        try:
            acts = self._get("my/activities")
        except requests.HTTPError as e:
            acts = []
            raw["error"] = str(e)
        
        raw["activities"] = acts
        
        # Calculate weekly/monthly distances
        week_0_km = 0.0
        week_kms = [0.0] * 4
        month_km = 0.0
        latest_activity: Optional[dict] = None
        
        for a in acts:
            if a.get("activityType") != "running":
                continue
            
            act_date = date.fromisoformat(a["startDateTimeLocal"][:10])
            km = a.get("distance") or 0
            
            # Current week
            if this_week_mon <= act_date <= today:
                week_0_km += km
            
            # Previous weeks
            for i, (mon, sun) in enumerate(weeks):
                if mon <= act_date <= sun:
                    week_kms[i] += km
                    break
            
            # Last month
            if last_mo_start <= act_date <= last_mo_end:
                month_km += km
            
            # Track latest for weather data
            if latest_activity is None:
                latest_activity = a
        
        result: dict[str, Any] = {
            "total_distance_km": stats.get("totalDistance", 0),
            "run_count": stats.get("runCount", 0),
            "longest_run_km": stats.get("longestRun", 0),
            "avg_pace": stats.get("averagePace", "N/A"),
            "week_0_km": round(week_0_km, 2),
            "last_month_km": round(month_km, 2),
            "last_month_label": last_mo_start.strftime("%B"),
            # Streak stats
            "longest_streak": stats.get("longestStreak"),
            "longest_streak_date": stats.get("longestStreakDate"),
            "longest_break_days": stats.get("longestBreakBetweenRuns"),
            "longest_break_date": stats.get("longestBreakBetweenRunsDate"),
            "avg_days_run_per_week": stats.get("averageDaysRunPerWeek"),
            "days_run_am": stats.get("daysRunAM"),
            "days_run_pm": stats.get("daysRunPM"),
            "days_run_both": stats.get("daysRunBoth"),
            "most_often_run_day": stats.get("mostOftenRunOnDay"),
            "_raw": raw,
        }
        
        # Add week labels and km
        for i, ((mon, sun), km) in enumerate(zip(weeks, week_kms)):
            label = f"{mon.strftime('%b %d')}-{sun.strftime('%d')}"
            result[f"week_{i+1}_km"] = round(km, 2)
            result[f"week_{i+1}_label"] = label
        
        # Add weather from latest activity
        if latest_activity:
            result["weather_temp"] = latest_activity.get("temperature")
            result["weather_temp_feels_like"] = latest_activity.get("temperatureApparent")
            result["weather_humidity"] = latest_activity.get("humidity")
            result["weather_wind_speed"] = latest_activity.get("windSpeed")
            result["weather_type"] = latest_activity.get("weatherType")
        
        return result
