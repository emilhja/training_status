"""Strava API client (optional integration).

Setup:
1. Create an app at https://www.strava.com/settings/api
2. Get your STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET
3. Obtain a refresh token with activity:read scope:
   - Visit: https://www.strava.com/oauth/authorize?client_id=YOUR_ID
     &response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read
   - Authorise in browser, copy the `code` from the redirect URL
   - Exchange: POST https://www.strava.com/oauth/token
     with client_id, client_secret, code, grant_type=authorization_code
   - Copy the refresh_token from the response
4. Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN to .env
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from ..config import Settings

_TOKEN_URL = "https://www.strava.com/oauth/token"
_API_BASE = "https://www.strava.com/api/v3"


class StravaClient:
    """Client for the Strava API using offline refresh-token flow."""

    def __init__(self, settings: Settings):
        if not (
            settings.strava_client_id
            and settings.strava_client_secret
            and settings.strava_refresh_token
        ):
            raise ValueError("Strava credentials not configured in .env")
        self.client_id = settings.strava_client_id
        self.client_secret = settings.strava_client_secret
        self.refresh_token = settings.strava_refresh_token
        self._access_token: str | None = None
        self._token_expires_at: float = 0.0

    def _get_access_token(self) -> str:
        """Refresh and cache the access token if expired."""
        now = datetime.now(tz=timezone.utc).timestamp()
        if self._access_token and now < self._token_expires_at - 60:
            return self._access_token

        resp = requests.post(
            _TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=15,
        )
        resp.raise_for_status()
        payload = resp.json()
        self._access_token = payload["access_token"]
        self._token_expires_at = float(payload["expires_at"])
        return self._access_token  # type: ignore[return-value]

    def _get(self, endpoint: str, params: dict | None = None) -> Any:
        token = self._get_access_token()
        resp = requests.get(
            f"{_API_BASE}/{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
            params=params or {},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()

    def get_stats(self) -> dict[str, Any]:
        """Fetch athlete profile and compute weekly/total running stats.

        Returns a dict compatible with the strava_* snapshot columns.
        """
        athlete = self._get("athlete")
        athlete_id = athlete.get("id")
        if not athlete_id:
            return {}

        stats = self._get(f"athletes/{athlete_id}/stats")

        total_km = round((stats.get("all_run_totals", {}).get("distance") or 0) / 1000, 1)
        ytd_km = round((stats.get("ytd_run_totals", {}).get("distance") or 0) / 1000, 1)
        run_count = stats.get("all_run_totals", {}).get("count") or 0

        # Weekly km: fetch recent activities and compute current-week total
        weekly_km = self._get_weekly_km()

        return {
            "strava_total_km": total_km,
            "strava_ytd_km": ytd_km,
            "strava_run_count": run_count,
            "strava_weekly_km": weekly_km,
        }

    def _get_weekly_km(self) -> float:
        """Compute km from Monday of the current week until today."""
        now = datetime.now(tz=timezone.utc)
        monday = now - timedelta(days=now.weekday())
        monday_ts = int(monday.replace(hour=0, minute=0, second=0).timestamp())

        activities = self._get(
            "athlete/activities",
            params={"after": monday_ts, "per_page": 100},
        )

        total = 0.0
        for act in activities:
            if act.get("type") == "Run":
                total += act.get("distance", 0.0)

        return round(total / 1000, 1)
