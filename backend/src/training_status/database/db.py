"""Database connection and query management."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

from .schema import (
    CREATE_GOALS_TABLE,
    CREATE_SNAPSHOTS_TABLE,
    INSERT_SNAPSHOT,
    MIGRATIONS,
    SNAPSHOT_COLUMNS,
)


class Database:
    """SQLite database manager."""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._ensure_dir()
    
    def _ensure_dir(self):
        """Ensure database directory exists."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    @contextmanager
    def connection(self):
        """Get a database connection context manager."""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()
    
    def init_schema(self):
        """Initialize database schema with migrations."""
        with self.connection() as conn:
            # Create tables
            conn.execute(CREATE_GOALS_TABLE)
            conn.execute(CREATE_SNAPSHOTS_TABLE)
            
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
            return cursor.lastrowid
    
    def get_latest_snapshot(self) -> Optional[tuple]:
        """Get the most recent snapshot."""
        cols = ", ".join(SNAPSHOT_COLUMNS)
        with self.connection() as conn:
            return conn.execute(
                f"SELECT {cols} FROM snapshots ORDER BY recorded_at DESC LIMIT 1"
            ).fetchone()
    
    def get_snapshots(self, limit: int = 90, offset: int = 0) -> tuple[int, list[tuple]]:
        """Get paginated snapshots. Returns (total_count, rows)."""
        cols = ", ".join(SNAPSHOT_COLUMNS)
        with self.connection() as conn:
            total = conn.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
            rows = conn.execute(
                f"SELECT {cols} FROM snapshots ORDER BY recorded_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
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
            return conn.execute(
                f"SELECT {cols} FROM snapshots ORDER BY recorded_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
    
    def get_history(self, days: int = 7) -> list[tuple]:
        """Get recent history for display."""
        with self.connection() as conn:
            return conn.execute("""
                SELECT recorded_at, ctl, atl, tsb, ac_ratio, resting_hr, hrv,
                       week_0_km, week_1_km, week_2_km, week_3_km, week_4_km, last_month_km
                FROM snapshots
                ORDER BY recorded_at DESC
                LIMIT ?
            """, (days,)).fetchall()
    
    # --- Goals ---
    
    def get_active_goals(self) -> list[sqlite3.Row]:
        """Get all active goals."""
        with self.connection() as conn:
            conn.row_factory = sqlite3.Row
            return conn.execute(
                "SELECT * FROM goals WHERE is_active = 1 ORDER BY created_at DESC"
            ).fetchall()
    
    def create_goal(self, goal_type: str, target_value: float, period_start: Optional[str] = None):
        """Create a new goal."""
        from datetime import datetime
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO goals (created_at, goal_type, target_value, period_start, is_active)
                   VALUES (?, ?, ?, ?, 1)""",
                (datetime.now().isoformat(), goal_type, target_value, period_start)
            )
    
    def deactivate_goal(self, goal_id: int):
        """Deactivate a goal."""
        with self.connection() as conn:
            conn.execute("UPDATE goals SET is_active = 0 WHERE id = ?", (goal_id,))


# Singleton instance — intentionally process-scoped.
# This works correctly with a single uvicorn worker (the default for this project).
# If you ever switch to multi-worker mode (--workers N > 1), each worker gets its
# own copy of this variable, which is safe with SQLite (one writer at a time) but
# means schema init runs once per worker. Do not share this instance across threads.
_db_instance: Optional[Database] = None


def get_db(db_path: Optional[Path] = None) -> Database:
    """Get or create the process-scoped database singleton."""
    global _db_instance
    if _db_instance is None:
        if db_path is None:
            from ..config import get_settings
            db_path = get_settings().db_path
        _db_instance = Database(db_path)
        _db_instance.init_schema()
    return _db_instance
