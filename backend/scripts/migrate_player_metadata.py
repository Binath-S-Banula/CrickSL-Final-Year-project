"""
migrate_player_metadata.py
───────────────────────────
Adds new columns to the existing players table:
  - batting_style
  - bowling_style
  - player_role
  - nationality

Run this ONCE before load_player_metadata.py

Usage (from backend/ folder):
    python scripts/migrate_player_metadata.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text


def migrate():
    print("🔄 Running player metadata migration...")

    migrations = [
        ("batting_style",  "ALTER TABLE players ADD COLUMN IF NOT EXISTS batting_style VARCHAR"),
        ("bowling_style",  "ALTER TABLE players ADD COLUMN IF NOT EXISTS bowling_style VARCHAR"),
        ("player_role",    "ALTER TABLE players ADD COLUMN IF NOT EXISTS player_role VARCHAR"),
        ("nationality",    "ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality VARCHAR"),
    ]

    with engine.connect() as conn:
        for col_name, sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"   ✅ Added column: {col_name}")
            except Exception as e:
                print(f"   ⚠️  Column {col_name}: {e}")

    print("\n✅ Migration complete!")
    print("   Now run: python scripts/load_player_metadata.py")


if __name__ == "__main__":
    migrate()
