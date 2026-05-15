"""
load_player_metadata.py
────────────────────────
Loads player metadata (batting style, bowling style, role)
from players_metadata.csv into the PostgreSQL players table.

Usage (from backend/ folder):
    python scripts/load_player_metadata.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from pathlib import Path
from database import SessionLocal
from models.db_models import Player

METADATA_PATH = Path(__file__).parent.parent / "data" / "players_metadata.csv"


def main():
    if not METADATA_PATH.exists():
        print(f"❌ File not found: {METADATA_PATH}")
        return

    # Read CSV — skip comment lines starting with #
    df = pd.read_csv(METADATA_PATH, comment="#")
    df = df.dropna(subset=["name"])
    df["name"] = df["name"].str.strip()

    print(f"📋 Loaded {len(df)} players from CSV")

    db = SessionLocal()
    updated = 0
    added = 0
    skipped = 0

    try:
        for _, row in df.iterrows():
            name = row["name"].strip()
            batting_style = str(row.get("batting_style", "")).strip()
            bowling_style = str(row.get("bowling_style", "")).strip()
            player_role = str(row.get("player_role", "")).strip()
            country = str(row.get("country", "")).strip()

            # Handle None/NaN bowling style
            if bowling_style.lower() in ["none", "nan", ""]:
                bowling_style = None

            # Find player in DB — try exact match first
            player = db.query(Player).filter(Player.name == name).first()

            if not player:
                # Try partial match for name variations
                # e.g. "SL Malinga" vs "Lasith Malinga"
                players_partial = db.query(Player).filter(
                    Player.name.ilike(f"%{name.split()[-1]}%")
                ).all()

                if len(players_partial) == 1:
                    player = players_partial[0]
                elif len(players_partial) > 1:
                    # Multiple matches — skip to avoid wrong assignment
                    skipped += 1
                    continue

            if player:
                # Update existing player
                player.batting_style = batting_style if batting_style else player.batting_style
                player.bowling_style = bowling_style
                player.player_role = player_role if player_role else player.player_role
                player.nationality = country if country else player.nationality
                updated += 1
            else:
                # Add new player
                new_player = Player(
                    name=name,
                    batting_style=batting_style,
                    bowling_style=bowling_style,
                    player_role=player_role,
                    nationality=country,
                )
                db.add(new_player)
                added += 1

        db.commit()
        print(f"\n✅ Player metadata loaded!")
        print(f"   Updated: {updated} existing players")
        print(f"   Added:   {added} new players")
        print(f"   Skipped: {skipped} (ambiguous name matches)")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
