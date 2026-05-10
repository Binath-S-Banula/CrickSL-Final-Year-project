"""
Migration: Create venue_display and cricket_countries tables
Run: venv\Scripts\python.exe scripts/migrate_admin_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:

        # ── 1. cricket_countries ─────────────────────────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cricket_countries (
                id          SERIAL PRIMARY KEY,
                name        VARCHAR(100) NOT NULL UNIQUE,
                code        VARCHAR(10),
                is_active   BOOLEAN DEFAULT TRUE,
                sort_order  INTEGER DEFAULT 99,
                created_at  TIMESTAMP DEFAULT NOW()
            )
        """))
        print("✅ cricket_countries table created")

        # Seed initial countries
        countries = [
            ("Afghanistan", "AFG", 1),
            ("Australia", "AUS", 2),
            ("Bangladesh", "BAN", 3),
            ("England", "ENG", 4),
            ("India", "IND", 5),
            ("Ireland", "IRE", 6),
            ("Kenya", "KEN", 7),
            ("Namibia", "NAM", 8),
            ("Netherlands", "NED", 9),
            ("New Zealand", "NZ", 10),
            ("Oman", "OMA", 11),
            ("Pakistan", "PAK", 12),
            ("Papua New Guinea", "PNG", 13),
            ("Scotland", "SCO", 14),
            ("South Africa", "SA", 15),
            ("Sri Lanka", "SL", 16),
            ("Uganda", "UGA", 17),
            ("United Arab Emirates", "UAE", 18),
            ("United States of America", "USA", 19),
            ("West Indies", "WI", 20),
            ("Zimbabwe", "ZIM", 21),
        ]
        for name, code, order in countries:
            conn.execute(text("""
                INSERT INTO cricket_countries (name, code, sort_order)
                VALUES (:name, :code, :order)
                ON CONFLICT (name) DO NOTHING
            """), {"name": name, "code": code, "order": order})
        print(f"✅ Seeded {len(countries)} countries")

        # ── 2. venue_display ─────────────────────────────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS venue_display (
                id           SERIAL PRIMARY KEY,
                venue_id     INTEGER REFERENCES venues(id) ON DELETE CASCADE,
                display_name VARCHAR(200) NOT NULL,
                country      VARCHAR(100) DEFAULT 'Sri Lanka',
                is_active    BOOLEAN DEFAULT TRUE,
                notes        TEXT,
                created_at   TIMESTAMP DEFAULT NOW(),
                updated_at   TIMESTAMP DEFAULT NOW()
            )
        """))
        print("✅ venue_display table created")

        # Seed SL venues — map to display names
        sl_venues = [
            ("R Premadasa Stadium, Colombo",
             ["premadasa"]),
            ("Pallekele International Cricket Stadium",
             ["pallekele"]),
            ("Galle International Stadium",
             ["galle international"]),
            ("Mahinda Rajapaksa International Cricket Stadium, Hambantota",
             ["mahinda", "sooriyawewa", "hambantota"]),
            ("Rangiri Dambulla International Stadium",
             ["dambulla", "rangiri"]),
            ("Sinhalese Sports Club Ground, Colombo",
             ["sinhalese"]),
            ("P Sara Oval, Colombo",
             ["p sara"]),
            ("Bloomfield Cricket and Athletic Club Ground",
             ["bloomfield"]),
        ]

        # Fetch all venues from DB
        rows = conn.execute(text("SELECT id, name FROM venues ORDER BY name")).fetchall()
        venue_map = {r[1].lower(): r[0] for r in rows}

        seeded = 0
        for display_name, keywords in sl_venues:
            # Find best matching venue_id
            venue_id = None
            for name_lower, vid in venue_map.items():
                if any(kw in name_lower for kw in keywords):
                    venue_id = vid
                    break

            if venue_id:
                # Check not already seeded
                existing = conn.execute(text(
                    "SELECT id FROM venue_display WHERE display_name = :dn"
                ), {"dn": display_name}).fetchone()
                if not existing:
                    conn.execute(text("""
                        INSERT INTO venue_display (venue_id, display_name, country, is_active)
                        VALUES (:vid, :dn, 'Sri Lanka', true)
                    """), {"vid": venue_id, "dn": display_name})
                    seeded += 1
                    print(f"  → Mapped: {display_name} (venue_id={venue_id})")
            else:
                print(f"  ⚠ No DB venue found for: {display_name}")

        conn.commit()
        print(f"\n✅ Seeded {seeded} SL venues in venue_display")
        print("\n🎉 Migration complete! Restart the server now.")

if __name__ == "__main__":
    run()
