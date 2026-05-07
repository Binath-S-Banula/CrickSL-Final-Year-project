from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()


def get_cutoff_date(years: int):
    if years == 0:
        return None  # All time
    return (datetime.now().date() - timedelta(days=years * 365)).isoformat()


@router.get("/dashboard/list")
def get_player_list(
    role: str = Query("all"),
    years: int = Query(3),
    db: Session = Depends(get_db)
):
    """
    Returns list of SL players filtered by role and era.
    Each player includes is_active badge based on last match date.
    """
    try:
        cutoff = get_cutoff_date(years)
        active_cutoff = get_cutoff_date(3)  # active = played within 3 years

        # Build role filter
        role_filter = ""
        role_lower = role.lower().strip()
        if role_lower != "all":
            role_filter = f"AND LOWER(pm.player_role) LIKE '%{role_lower.replace(\"'\", \"''\")}%'"

        # Build date filter
        date_filter = ""
        if cutoff:
            date_filter = f"AND m.date >= '{cutoff}'"

        sql = text(f"""
            SELECT DISTINCT
                p.name,
                pm.player_role AS role,
                pm.batting_style,
                pm.bowling_style,
                MAX(m.date) AS last_match_date
            FROM players p
            JOIN player_metadata pm ON p.name = pm.name
            JOIN (
                SELECT DISTINCT batter AS player_name, match_id FROM deliveries
                UNION
                SELECT DISTINCT bowler AS player_name, match_id FROM deliveries
            ) d ON d.player_name = p.name
            JOIN matches m ON m.id = d.match_id
            WHERE (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              AND pm.player_role IS NOT NULL
              AND pm.batting_style IS NOT NULL
              {role_filter}
              {date_filter}
            GROUP BY p.name, pm.player_role, pm.batting_style, pm.bowling_style
            ORDER BY MAX(m.date) DESC NULLS LAST
            LIMIT 100
        """)

        rows = db.execute(sql).fetchall()

        players = []
        for row in rows:
            last_date = row[4]
            is_active = False
            if last_date and active_cutoff:
                is_active = str(last_date) >= active_cutoff
            elif last_date:
                is_active = True  # all time mode

            players.append({
                "name": row[0] or "",
                "role": row[1] or "",
                "batting_style": row[2] or "",
                "bowling_style": row[3] or "",
                "last_match_date": str(last_date) if last_date else None,
                "is_active": is_active,
            })

        return players

    except Exception as e:
        # Fallback: try a simpler query
        try:
            sql2 = text("""
                SELECT DISTINCT p.name, pm.player_role, pm.batting_style, pm.bowling_style
                FROM players p
                JOIN player_metadata pm ON p.name = pm.name
                WHERE pm.player_role IS NOT NULL AND pm.batting_style IS NOT NULL
                ORDER BY p.name
                LIMIT 100
            """)
            rows = db.execute(sql2).fetchall()
            return [
                {"name": r[0], "role": r[1] or "", "batting_style": r[2] or "",
                 "bowling_style": r[3] or "", "is_active": True, "last_match_date": None}
                for r in rows
            ]
        except Exception as e2:
            return []


@router.get("/dashboard/stats")
def get_player_stats(
    name: str = Query(...),
    years: int = Query(3),
    db: Session = Depends(get_db)
):
    """
    Returns comprehensive stats for one player.
    """
    try:
        cutoff = get_cutoff_date(years)
        active_cutoff = get_cutoff_date(3)

        date_filter = f"AND m.date >= '{cutoff}'" if cutoff else ""

        # --- Player metadata ---
        meta = db.execute(text("""
            SELECT p.name, pm.player_role, pm.batting_style, pm.bowling_style
            FROM players p
            LEFT JOIN player_metadata pm ON p.name = pm.name
            WHERE p.name = :name
            LIMIT 1
        """), {"name": name}).fetchone()

        # --- Last match date ---
        last_match_row = db.execute(text(f"""
            SELECT MAX(m.date) FROM matches m
            JOIN deliveries d ON d.match_id = m.id
            WHERE (d.batter = :name OR d.bowler = :name)
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
        """), {"name": name}).fetchone()
        last_match_date = last_match_row[0] if last_match_row else None

        is_active = False
        if last_match_date and active_cutoff:
            is_active = str(last_match_date) >= active_cutoff

        # --- Batting overview ---
        batting_sql = text(f"""
            SELECT
                COUNT(DISTINCT d.match_id) AS matches,
                COUNT(*) AS innings,
                SUM(d.runs_batter) AS total_runs,
                MAX(d.runs_batter) AS highest,  
                SUM(CASE WHEN d.is_boundary_four THEN 1 ELSE 0 END) AS fours,
                SUM(CASE WHEN d.is_boundary_six THEN 1 ELSE 0 END) AS sixes,
                SUM(CASE WHEN d.is_wicket AND d.player_out = :name AND d.runs_batter = 0 THEN 1 ELSE 0 END) AS golden_ducks
            FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.batter = :name
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
        """)

        br = db.execute(batting_sql, {"name": name}).fetchone()

        # Innings-level stats (for average, highest score per innings, ducks, 50s, 100s)
        innings_sql = text(f"""
            SELECT
                SUM(inn_runs) AS total_runs_check,
                AVG(NULLIF(inn_balls, 0) * 1.0) AS avg_balls,
                COUNT(*) AS innings_count,
                SUM(CASE WHEN inn_runs = 0 AND dismissed = 1 THEN 1 ELSE 0 END) AS ducks,
                SUM(CASE WHEN inn_runs >= 50 AND inn_runs < 100 THEN 1 ELSE 0 END) AS fifties,
                SUM(CASE WHEN inn_runs >= 100 THEN 1 ELSE 0 END) AS hundreds,
                MAX(inn_runs) AS highest_score,
                SUM(CASE WHEN dismissed = 1 THEN 1 ELSE 0 END) AS dismissals
            FROM (
                SELECT
                    d.match_id,
                    i.id AS innings_id,
                    SUM(d.runs_batter) AS inn_runs,
                    COUNT(*) AS inn_balls,
                    MAX(CASE WHEN d.is_wicket AND d.player_out = :name THEN 1 ELSE 0 END) AS dismissed
                FROM deliveries d
                JOIN innings i ON i.id = d.innings_id
                JOIN matches m ON m.id = d.match_id
                WHERE d.batter = :name
                  AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
                  {date_filter}
                GROUP BY d.match_id, i.id
            ) sub
        """)
        ir = db.execute(innings_sql, {"name": name}).fetchone()

        total_runs = int(ir[0] or 0) if ir else 0
        innings_count = int(ir[2] or 0) if ir else 0
        ducks = int(ir[3] or 0) if ir else 0
        fifties = int(ir[4] or 0) if ir else 0
        hundreds = int(ir[5] or 0) if ir else 0
        highest_score = int(ir[6] or 0) if ir else 0
        dismissals = int(ir[7] or 0) if ir else 0
        golden_ducks = int(br[6] or 0) if br else 0
        fours = int(br[4] or 0) if br else 0
        sixes = int(br[5] or 0) if br else 0
        batting_matches = int(br[0] or 0) if br else 0

        # total balls faced
        balls_faced_row = db.execute(text(f"""
            SELECT COUNT(*) FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.batter = :name
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
        """), {"name": name}).fetchone()
        balls_faced = int(balls_faced_row[0] or 0) if balls_faced_row else 0

        batting_avg = round(total_runs / dismissals, 2) if dismissals > 0 else total_runs
        batting_sr = round((total_runs / balls_faced) * 100, 2) if balls_faced > 0 else 0.0

        batting_overview = {
            "matches": batting_matches,
            "innings": innings_count,
            "total_runs": total_runs,
            "average": batting_avg,
            "strike_rate": batting_sr,
            "highest_score": highest_score,
            "fifties": fifties,
            "hundreds": hundreds,
            "ducks": ducks,
            "golden_ducks": golden_ducks,
            "boundaries": fours,
            "sixes": sixes,
        }

        # --- Dismissals breakdown ---
        dismissal_rows = db.execute(text(f"""
            SELECT d.wicket_kind, COUNT(*) AS cnt
            FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.is_wicket AND d.player_out = :name
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
            GROUP BY d.wicket_kind
            ORDER BY cnt DESC
        """), {"name": name}).fetchall()

        dismissals_dict = {}
        most_common = None
        most_common_count = 0
        for row in dismissal_rows:
            kind = row[0] or "unknown"
            cnt = int(row[1] or 0)
            dismissals_dict[kind] = cnt
            if cnt > most_common_count:
                most_common_count = cnt
                most_common = kind

        # --- Score distribution ---
        score_dist_rows = db.execute(text(f"""
            SELECT
                CASE
                    WHEN inn_runs = 0 THEN '0'
                    WHEN inn_runs BETWEEN 1 AND 9 THEN '1-9'
                    WHEN inn_runs BETWEEN 10 AND 19 THEN '10-19'
                    WHEN inn_runs BETWEEN 20 AND 29 THEN '20-29'
                    WHEN inn_runs BETWEEN 30 AND 49 THEN '30-49'
                    WHEN inn_runs BETWEEN 50 AND 99 THEN '50-99'
                    ELSE '100+'
                END AS score_range,
                COUNT(*) AS cnt
            FROM (
                SELECT d.match_id, i.id AS innings_id, SUM(d.runs_batter) AS inn_runs
                FROM deliveries d
                JOIN innings i ON i.id = d.innings_id
                JOIN matches m ON m.id = d.match_id
                WHERE d.batter = :name
                  AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
                  {date_filter}
                GROUP BY d.match_id, i.id
            ) sub
            GROUP BY score_range
            ORDER BY MIN(inn_runs)
        """), {"name": name}).fetchall()

        score_dist = {}
        ordered_ranges = ["0", "1-9", "10-19", "20-29", "30-49", "50-99", "100+"]
        for r in score_dist_rows:
            score_dist[r[0]] = int(r[1] or 0)
        score_distribution = {k: score_dist.get(k, 0) for k in ordered_ranges}

        # --- Phase batting ---
        phase_batting_rows = db.execute(text(f"""
            SELECT
                d.phase,
                SUM(d.runs_batter) AS runs,
                COUNT(*) AS balls,
                SUM(CASE WHEN d.is_wicket AND d.player_out = :name THEN 1 ELSE 0 END) AS dismissals
            FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.batter = :name
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
            GROUP BY d.phase
        """), {"name": name}).fetchall()

        phase_batting = {}
        most_vulnerable_phase = None
        max_dismissals = -1
        for row in phase_batting_rows:
            phase = row[0] or "unknown"
            runs = int(row[1] or 0)
            balls = int(row[2] or 0)
            dis = int(row[3] or 0)
            sr = round((runs / balls) * 100, 2) if balls > 0 else 0
            phase_batting[phase] = {"runs": runs, "balls": balls, "strike_rate": sr, "dismissals": dis}
            if dis > max_dismissals:
                max_dismissals = dis
                most_vulnerable_phase = phase

        # --- Bowling overview ---
        bowling_sql = text(f"""
            SELECT
                COUNT(DISTINCT d.match_id) AS matches,
                COUNT(*) AS balls,
                SUM(d.runs_batter + d.runs_extras) AS runs_conceded,
                SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN ('run out', 'retired hurt', 'obstructing the field') THEN 1 ELSE 0 END) AS wickets,
                SUM(CASE WHEN d.runs_batter = 0 AND d.runs_extras = 0 THEN 1 ELSE 0 END) AS dots
            FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.bowler = :name
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
        """)
        bwl = db.execute(bowling_sql, {"name": name}).fetchone()

        bowling_overview = {}
        if bwl and int(bwl[1] or 0) > 0:
            b_matches = int(bwl[0] or 0)
            b_balls = int(bwl[1] or 0)
            b_runs = int(bwl[2] or 0)
            b_wickets = int(bwl[3] or 0)
            b_dots = int(bwl[4] or 0)
            b_overs = b_balls / 6
            economy = round(b_runs / b_overs, 2) if b_overs > 0 else 0
            b_avg = round(b_runs / b_wickets, 2) if b_wickets > 0 else 0
            b_sr = round(b_balls / b_wickets, 2) if b_wickets > 0 else 0
            dot_pct = round((b_dots / b_balls) * 100, 1) if b_balls > 0 else 0

            # Best figures
            best_fig_row = db.execute(text(f"""
                SELECT wkts, runs_c FROM (
                    SELECT
                        SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN ('run out','retired hurt','obstructing the field') THEN 1 ELSE 0 END) AS wkts,
                        SUM(d.runs_batter + d.runs_extras) AS runs_c
                    FROM deliveries d
                    JOIN matches m ON m.id = d.match_id
                    WHERE d.bowler = :name
                      AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
                      {date_filter}
                    GROUP BY d.match_id
                ) sub ORDER BY wkts DESC, runs_c ASC LIMIT 1
            """), {"name": name}).fetchone()

            best_figures = f"{int(best_fig_row[0])}/{int(best_fig_row[1])}" if best_fig_row else "—"

            # 5-wicket hauls
            five_wkts_row = db.execute(text(f"""
                SELECT COUNT(*) FROM (
                    SELECT d.match_id,
                        SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN ('run out','retired hurt','obstructing the field') THEN 1 ELSE 0 END) AS wkts
                    FROM deliveries d
                    JOIN matches m ON m.id = d.match_id
                    WHERE d.bowler = :name
                      AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
                      {date_filter}
                    GROUP BY d.match_id
                    HAVING SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN ('run out','retired hurt','obstructing the field') THEN 1 ELSE 0 END) >= 5
                ) sub
            """), {"name": name}).fetchone()
            five_wickets = int(five_wkts_row[0] or 0) if five_wkts_row else 0

            bowling_overview = {
                "matches": b_matches,
                "wickets": b_wickets,
                "economy": economy,
                "average": b_avg,
                "bowling_sr": b_sr,
                "dot_pct": dot_pct,
                "best_figures": best_figures,
                "five_wickets": five_wickets,
            }

        # --- Wicket types ---
        wkt_rows = db.execute(text(f"""
            SELECT d.wicket_kind, COUNT(*) AS cnt
            FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.bowler = :name AND d.is_wicket
              AND d.wicket_kind NOT IN ('run out', 'retired hurt', 'obstructing the field')
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
            GROUP BY d.wicket_kind
            ORDER BY cnt DESC
        """), {"name": name}).fetchall()
        wicket_types = {r[0]: int(r[1]) for r in wkt_rows if r[0]}

        # --- Phase bowling ---
        phase_bowling_rows = db.execute(text(f"""
            SELECT
                d.phase,
                SUM(d.runs_batter + d.runs_extras) AS runs,
                COUNT(*) AS balls,
                SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN ('run out','retired hurt','obstructing the field') THEN 1 ELSE 0 END) AS wickets
            FROM deliveries d
            JOIN matches m ON m.id = d.match_id
            WHERE d.bowler = :name
              AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
              {date_filter}
            GROUP BY d.phase
        """), {"name": name}).fetchall()

        phase_bowling = {}
        for row in phase_bowling_rows:
            phase = row[0] or "unknown"
            runs = int(row[1] or 0)
            balls = int(row[2] or 0)
            wickets = int(row[3] or 0)
            overs = balls / 6
            economy = round(runs / overs, 2) if overs > 0 else 0
            phase_bowling[phase] = {"runs": runs, "balls": balls, "economy": economy, "wickets": wickets}

        # --- Recent form ---
        recent_form = []
        try:
            if batting_overview.get("innings", 0) > 0:
                rf_rows = db.execute(text(f"""
                    SELECT
                        m.date,
                        CASE WHEN m.team1 = 'Sri Lanka' THEN m.team2 ELSE m.team1 END AS opponent,
                        SUM(d.runs_batter) AS runs,
                        MAX(CASE WHEN d.is_wicket AND d.player_out = :name THEN d.wicket_kind ELSE NULL END) AS dismissal
                    FROM deliveries d
                    JOIN innings i ON i.id = d.innings_id
                    JOIN matches m ON m.id = d.match_id
                    WHERE d.batter = :name
                      AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')
                      {date_filter}
                    GROUP BY m.date, m.id, opponent
                    ORDER BY m.date DESC
                    LIMIT 10
                """), {"name": name}).fetchall()

                for row in rf_rows:
                    recent_form.append({
                        "date": str(row[0]) if row[0] else "—",
                        "opponent": row[1] or "—",
                        "runs": int(row[2] or 0),
                        "dismissal": row[3] or "Not Out",
                    })
        except Exception:
            pass

        return {
            "name": name,
            "role": meta[1] if meta else "",
            "batting_style": meta[2] if meta else "",
            "bowling_style": meta[3] if meta else "",
            "last_match_date": str(last_match_date) if last_match_date else None,
            "is_active": is_active,
            "batting_overview": batting_overview,
            "dismissals": dismissals_dict,
            "most_common_dismissal": most_common,
            "most_vulnerable_phase": most_vulnerable_phase,
            "score_distribution": score_distribution,
            "phase_batting": phase_batting,
            "bowling_overview": bowling_overview,
            "wicket_types": wicket_types,
            "phase_bowling": phase_bowling,
            "recent_form": recent_form,
        }

    except Exception as e:
        return {
            "name": name,
            "error": str(e),
            "batting_overview": {},
            "bowling_overview": {},
            "dismissals": {},
            "wicket_types": {},
            "score_distribution": {},
            "phase_batting": {},
            "phase_bowling": {},
            "recent_form": [],
            "is_active": False,
        }
