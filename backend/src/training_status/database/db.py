"""Database connection and query management."""

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from .schema import (
    CREATE_ANNOTATIONS_TABLE,
    CREATE_GEAR_TABLE,
    CREATE_GOALS_TABLE,
    CREATE_HEALTH_EVENTS_TABLE,
    CREATE_PERSONAL_RECORDS_TABLE,
    CREATE_SHARED_LINKS_TABLE,
    CREATE_SNAPSHOTS_TABLE,
    CREATE_TRAINING_NOTES_TABLE,
    INSERT_SNAPSHOT,
    MIGRATIONS,
    SNAPSHOT_COLUMNS,
)


class Database:
    """SQLite database manager."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._ensure_dir()

    def _ensure_dir(self) -> None:
        """Ensure database directory exists."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        """Get a database connection context manager."""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_schema(self) -> None:
        """Initialize database schema with migrations."""
        with self.connection() as conn:
            # Create tables
            conn.execute(CREATE_GOALS_TABLE)
            conn.execute(CREATE_SNAPSHOTS_TABLE)
            conn.execute(CREATE_PERSONAL_RECORDS_TABLE)
            conn.execute(CREATE_TRAINING_NOTES_TABLE)
            conn.execute(CREATE_GEAR_TABLE)
            conn.execute(CREATE_HEALTH_EVENTS_TABLE)
            conn.execute(CREATE_ANNOTATIONS_TABLE)
            conn.execute(CREATE_SHARED_LINKS_TABLE)

            # Apply migrations
            for col, typ in MIGRATIONS:
                try:
                    conn.execute(f"ALTER TABLE snapshots ADD COLUMN {col} {typ}")
                except sqlite3.OperationalError:
                    pass  # Column already exists

    def insert_snapshot(self, data: dict) -> int:
        """Insert a new snapshot. Returns the new row ID."""
        with self.connection() as conn:
            cursor = conn.execute(INSERT_SNAPSHOT, data)
            return cursor.lastrowid  # type: ignore[return-value]

    def get_latest_snapshot(self) -> tuple | None:
        """Get the most recent snapshot."""
        cols = ", ".join(SNAPSHOT_COLUMNS)
        with self.connection() as conn:
            return conn.execute(  # type: ignore[no-any-return]
                f"SELECT {cols} FROM snapshots ORDER BY recorded_at DESC LIMIT 1"
            ).fetchone()

    def get_snapshots(self, limit: int = 90, offset: int = 0) -> tuple[int, list[tuple]]:
        """Get paginated snapshots. Returns (total_count, rows)."""
        cols = ", ".join(SNAPSHOT_COLUMNS)
        with self.connection() as conn:
            total = conn.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
            rows = conn.execute(  # type: ignore[assignment]
                f"SELECT {cols} FROM snapshots ORDER BY recorded_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
        return total, rows

    def get_snapshots_for_analytics(self, columns: list[str], limit: int = 30) -> list[tuple]:
        """Get specific columns for analytics.

        Only columns present in SNAPSHOT_COLUMNS are allowed; unknown names raise ValueError.
        """
        _valid = set(SNAPSHOT_COLUMNS)
        invalid = [c for c in columns if c not in _valid]
        if invalid:
            raise ValueError(f"Unknown column(s) requested: {invalid}")
        cols = ", ".join(columns)
        with self.connection() as conn:
            return conn.execute(  # type: ignore[return-value]
                f"SELECT {cols} FROM snapshots ORDER BY recorded_at DESC LIMIT ?", (limit,)
            ).fetchall()

    def get_history(self, days: int = 7) -> list[tuple]:
        """Get recent history for display."""
        with self.connection() as conn:
            return conn.execute(  # type: ignore[return-value]
                """
                SELECT recorded_at, ctl, atl, tsb, ac_ratio, resting_hr, hrv,
                       week_0_km, week_1_km, week_2_km, week_3_km, week_4_km, last_month_km
                FROM snapshots
                ORDER BY recorded_at DESC
                LIMIT ?
            """,
                (days,),
            ).fetchall()

    # --- Goals ---

    def get_active_goals(self) -> list[sqlite3.Row]:
        """Get all active goals."""
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM goals WHERE is_active = 1 ORDER BY created_at DESC"
            ).fetchall()

    def create_goal(
        self, goal_type: str, target_value: float, period_start: str | None = None
    ) -> None:
        """Create a new goal."""
        from datetime import datetime

        with self.connection() as conn:
            conn.execute(
                """INSERT INTO goals (created_at, goal_type, target_value, period_start, is_active)
                   VALUES (?, ?, ?, ?, 1)""",
                (datetime.now().isoformat(), goal_type, target_value, period_start),
            )

    def deactivate_goal(self, goal_id: int) -> None:
        """Deactivate a goal."""
        with self.connection() as conn:
            conn.execute("UPDATE goals SET is_active = 0 WHERE id = ?", (goal_id,))

    # --- Personal Records ---

    def get_personal_records(self) -> list[sqlite3.Row]:
        """Get all personal records ordered by distance."""
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM personal_records ORDER BY distance_m ASC"
            ).fetchall()

    def upsert_record_if_pr(
        self,
        distance_label: str,
        distance_m: int,
        time_secs: float,
        pace_str: str,
        activity_date: str,
        activity_id: str | None = None,
    ) -> bool:
        """Insert or update a personal record if the new time is faster.

        Returns True if a new PR was set.
        """
        from datetime import datetime

        with self.connection() as conn:
            existing = conn.execute(
                "SELECT id, time_secs FROM personal_records WHERE distance_label = ?",
                (distance_label,),
            ).fetchone()

            if existing is None:
                conn.execute(
                    """INSERT INTO personal_records
                       (detected_at, distance_label, distance_m,
                        time_secs, pace_str, activity_date, activity_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        datetime.now().isoformat(),
                        distance_label,
                        distance_m,
                        time_secs,
                        pace_str,
                        activity_date,
                        activity_id,
                    ),
                )
                return True

            if time_secs < existing[1]:
                conn.execute(
                    """UPDATE personal_records
                       SET detected_at=?, time_secs=?, pace_str=?, activity_date=?, activity_id=?
                       WHERE distance_label=?""",
                    (
                        datetime.now().isoformat(),
                        time_secs,
                        pace_str,
                        activity_date,
                        activity_id,
                        distance_label,
                    ),
                )
                return True

        return False

    # --- Training Notes ---

    def get_notes(self, limit: int = 50) -> list[sqlite3.Row]:
        """Get training notes, most recent first."""
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM training_notes ORDER BY note_date DESC, created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()

    def create_note(self, note_date: str, content: str) -> None:
        """Create a new training note."""
        from datetime import datetime

        with self.connection() as conn:
            conn.execute(
                "INSERT INTO training_notes (created_at, note_date, content) VALUES (?, ?, ?)",
                (datetime.now().isoformat(), note_date, content),
            )

    def delete_note(self, note_id: int) -> None:
        """Delete a training note."""
        with self.connection() as conn:
            conn.execute("DELETE FROM training_notes WHERE id = ?", (note_id,))

    # --- Gear ---

    def get_gear(self, active_only: bool = True) -> list[sqlite3.Row]:
        """Get gear items."""
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            q = "SELECT * FROM gear WHERE is_active = 1" if active_only else "SELECT * FROM gear"
            return conn.execute(q + " ORDER BY created_at DESC").fetchall()  # type: ignore[return-value]

    def create_gear(
        self, name: str, gear_type: str, brand: str | None,
        purchase_date: str | None, retirement_km: float,
    ) -> None:
        from datetime import datetime

        with self.connection() as conn:
            conn.execute(
                """INSERT INTO gear (name, gear_type, brand, purchase_date,
                   retirement_km, accumulated_km, is_active, created_at)
                   VALUES (?, ?, ?, ?, ?, 0, 1, ?)""",
                (name, gear_type, brand, purchase_date, retirement_km,
                 datetime.now().isoformat()),
            )

    def update_gear(self, gear_id: int, **kwargs: object) -> None:
        allowed = {"name", "brand", "retirement_km", "accumulated_km", "is_active"}
        fields = {k: v for k, v in kwargs.items() if k in allowed}
        if not fields:
            return
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        with self.connection() as conn:
            conn.execute(
                f"UPDATE gear SET {set_clause} WHERE id = ?",
                (*fields.values(), gear_id),
            )

    def delete_gear(self, gear_id: int) -> None:
        with self.connection() as conn:
            conn.execute("UPDATE gear SET is_active = 0 WHERE id = ?", (gear_id,))

    # --- Health Events ---

    def get_health_events(self, limit: int = 50) -> list[sqlite3.Row]:
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM health_events ORDER BY event_date DESC LIMIT ?",
                (limit,),
            ).fetchall()

    def create_health_event(
        self, event_date: str, end_date: str | None, event_type: str,
        description: str, tags: str | None,
    ) -> None:
        from datetime import datetime

        with self.connection() as conn:
            conn.execute(
                """INSERT INTO health_events
                   (event_date, end_date, event_type, description, tags, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (event_date, end_date, event_type, description, tags,
                 datetime.now().isoformat()),
            )

    def update_health_event(self, event_id: int, **kwargs: object) -> None:
        allowed = {"end_date", "description", "tags"}
        fields = {k: v for k, v in kwargs.items() if k in allowed}
        if not fields:
            return
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        with self.connection() as conn:
            conn.execute(
                f"UPDATE health_events SET {set_clause} WHERE id = ?",
                (*fields.values(), event_id),
            )

    def delete_health_event(self, event_id: int) -> None:
        with self.connection() as conn:
            conn.execute("DELETE FROM health_events WHERE id = ?", (event_id,))

    # --- Annotations ---

    def get_annotations(self, metric: str | None = None, limit: int = 100) -> list[sqlite3.Row]:
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            if metric:
                return conn.execute(  # type: ignore[return-value]
                    "SELECT * FROM annotations WHERE metric = ? ORDER BY annotation_date DESC LIMIT ?",
                    (metric, limit),
                ).fetchall()
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM annotations ORDER BY annotation_date DESC LIMIT ?",
                (limit,),
            ).fetchall()

    def create_annotation(self, annotation_date: str, metric: str, content: str) -> None:
        from datetime import datetime

        with self.connection() as conn:
            conn.execute(
                "INSERT INTO annotations (annotation_date, metric, content, created_at) VALUES (?, ?, ?, ?)",
                (annotation_date, metric, content, datetime.now().isoformat()),
            )

    def delete_annotation(self, annotation_id: int) -> None:
        with self.connection() as conn:
            conn.execute("DELETE FROM annotations WHERE id = ?", (annotation_id,))

    # --- Shared Links ---

    def create_shared_link(self, token: str, expires_at: str | None = None) -> None:
        from datetime import datetime

        with self.connection() as conn:
            conn.execute(
                "INSERT INTO shared_links (token, created_at, expires_at, is_active) VALUES (?, ?, ?, 1)",
                (token, datetime.now().isoformat(), expires_at),
            )

    def get_shared_link(self, token: str) -> sqlite3.Row | None:
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM shared_links WHERE token = ?", (token,)
            ).fetchone()

    def get_all_shared_links(self) -> list[sqlite3.Row]:
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(  # type: ignore[return-value]
                "SELECT * FROM shared_links WHERE is_active = 1 ORDER BY created_at DESC"
            ).fetchall()

    def deactivate_shared_link(self, token: str) -> None:
        with self.connection() as conn:
            conn.execute("UPDATE shared_links SET is_active = 0 WHERE token = ?", (token,))


# Singleton instance — intentionally process-scoped.
# This works correctly with a single uvicorn worker (the default for this project).
# If you ever switch to multi-worker mode (--workers N > 1), each worker gets its
# own copy of this variable, which is safe with SQLite (one writer at a time) but
# means schema init runs once per worker. Do not share this instance across threads.
_db_instance: Database | None = None


def get_db(db_path: Path | None = None) -> Database:
    """Get or create the process-scoped database singleton."""
    global _db_instance
    if _db_instance is None:
        if db_path is None:
            from ..config import get_settings

            db_path = get_settings().db_path
        _db_instance = Database(db_path)
        _db_instance.init_schema()
    return _db_instance
