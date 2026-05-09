from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from datetime import datetime, timedelta

router = APIRouter()


def get_cutoff(years: int):
    if years == 0:
        return None
    return (datetime.now().date() - timedelta(days=years * 365)).isoformat()


def date_clause(cutoff, alias="m"):
    return f"AND {alias}.date >= '{cutoff}'" if cutoff else ""


@router.get("/dashboard/list")
def get_player_list(
    role: str = Query("all"),
    years: int = Query(3),
    db: Session = Depends(get_db)
):
    try:
        cutoff = get_cutoff(years)
        active_cutoff = get_cutoff(3)
        df = date_clause(cutoff)

        role_lower = role.lower().strip()
        safe_role = role_lower.replace("'", "''")
        role_filter = "" if role_lower == "all" else f"AND LOWER(p.player_role) LIKE '%{safe_role}%'"

        query = (
            "SELECT p.name, p.player_role, p.batting_style, p.bowling_style, MAX(m.date) AS last_date "
            "FROM players p "
            "JOIN deliveries d ON (d.batter = p.name OR d.bowler = p.name) "
            "JOIN matches m ON m.id = d.match_id "
            "WHERE (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka') "
            "  AND p.nationality = 'Sri Lanka' "
            "  AND p.player_role IS NOT NULL "
            "  AND p.batting_style IS NOT NULL "
            f" {role_filter} {df} "
            "GROUP BY p.name, p.player_role, p.batting_style, p.bowling_style "
            "ORDER BY MAX(m.date) DESC NULLS LAST "
            "LIMIT 100"
        )

        rows = db.execute(text(query)).fetchall()
        players = []
        for row in rows:
            last_date = row[4]
            is_active = bool(last_date and active_cutoff and str(last_date) >= active_cutoff)
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
        # Fallback — just return all SL players with metadata
        try:
            rows = db.execute(text(
                "SELECT name, player_role, batting_style, bowling_style FROM players "
                "WHERE nationality = 'Sri Lanka' AND player_role IS NOT NULL "
                "ORDER BY name LIMIT 100"
            )).fetchall()
            return [{"name": r[0], "role": r[1] or "", "batting_style": r[2] or "",
                     "bowling_style": r[3] or "", "is_active": True, "last_match_date": None}
                    for r in rows]
        except Exception:
            return []


@router.get("/dashboard/stats")
def get_player_stats(
    name: str = Query(...),
    years: int = Query(3),
    db: Session = Depends(get_db)
):
    try:
        cutoff = get_cutoff(years)
        active_cutoff = get_cutoff(3)
        df = date_clause(cutoff)
        NOT_OUT = "('run out','retired hurt','obstructing the field')"

        # Metadata from players table directly
        meta = db.execute(text(
            "SELECT name, player_role, batting_style, bowling_style FROM players WHERE name = :name LIMIT 1"
        ), {"name": name}).fetchone()

        # Last match
        lm = db.execute(text(
            "SELECT MAX(m.date) FROM matches m JOIN deliveries d ON d.match_id = m.id "
            "WHERE (d.batter = :name OR d.bowler = :name) "
            "AND (m.team1 = 'Sri Lanka' OR m.team2 = 'Sri Lanka')"
        ), {"name": name}).fetchone()
        last_match_date = lm[0] if lm else None
        is_active = bool(last_match_date and active_cutoff and str(last_match_date) >= active_cutoff)

        # --- BATTING ---
        br = db.execute(text(
            "SELECT COUNT(DISTINCT d.match_id), COUNT(*), "
            "SUM(d.runs_batter), "
            "SUM(CASE WHEN d.is_boundary_four THEN 1 ELSE 0 END), "
            "SUM(CASE WHEN d.is_boundary_six THEN 1 ELSE 0 END), "
            "SUM(CASE WHEN d.is_wicket AND d.player_out = :name AND d.runs_batter = 0 THEN 1 ELSE 0 END) "
            f"FROM deliveries d JOIN matches m ON m.id = d.match_id "
            f"WHERE d.batter = :name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df}"
        ), {"name": name}).fetchone()

        batting_matches = int(br[0] or 0) if br else 0
        balls_faced    = int(br[1] or 0) if br else 0
        total_runs_raw = int(br[2] or 0) if br else 0
        fours          = int(br[3] or 0) if br else 0
        sixes          = int(br[4] or 0) if br else 0
        golden_ducks   = int(br[5] or 0) if br else 0

        # Innings-level
        ir = db.execute(text(
            "SELECT SUM(inn_runs), COUNT(*), "
            "SUM(CASE WHEN inn_runs=0 AND dismissed=1 THEN 1 ELSE 0 END), "
            "SUM(CASE WHEN inn_runs>=50 AND inn_runs<100 THEN 1 ELSE 0 END), "
            "SUM(CASE WHEN inn_runs>=100 THEN 1 ELSE 0 END), "
            "MAX(inn_runs), SUM(CASE WHEN dismissed=1 THEN 1 ELSE 0 END) "
            "FROM ("
            "  SELECT d.match_id, i.id, SUM(d.runs_batter) AS inn_runs, "
            "  MAX(CASE WHEN d.is_wicket AND d.player_out=:name THEN 1 ELSE 0 END) AS dismissed "
            "  FROM deliveries d JOIN innings i ON i.id=d.innings_id "
            f" JOIN matches m ON m.id=d.match_id "
            f" WHERE d.batter=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
            "  GROUP BY d.match_id, i.id) sub"
        ), {"name": name}).fetchone()

        total_runs      = int(ir[0] or 0) if ir else 0
        innings_count   = int(ir[1] or 0) if ir else 0
        ducks           = int(ir[2] or 0) if ir else 0
        fifties         = int(ir[3] or 0) if ir else 0
        hundreds        = int(ir[4] or 0) if ir else 0
        highest_score   = int(ir[5] or 0) if ir else 0
        dismissals_count= int(ir[6] or 0) if ir else 0

        batting_avg = round(total_runs / dismissals_count, 2) if dismissals_count > 0 else float(total_runs)
        batting_sr  = round((total_runs / balls_faced) * 100, 2) if balls_faced > 0 else 0.0

        batting_overview = {
            "matches": batting_matches, "innings": innings_count, "total_runs": total_runs,
            "average": batting_avg, "strike_rate": batting_sr, "highest_score": highest_score,
            "fifties": fifties, "hundreds": hundreds, "ducks": ducks,
            "golden_ducks": golden_ducks, "boundaries": fours, "sixes": sixes,
        }

        # Dismissal breakdown
        dism_rows = db.execute(text(
            "SELECT d.wicket_kind, COUNT(*) FROM deliveries d JOIN matches m ON m.id=d.match_id "
            f"WHERE d.is_wicket AND d.player_out=:name "
            f"AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
            "GROUP BY d.wicket_kind ORDER BY COUNT(*) DESC"
        ), {"name": name}).fetchall()
        dismissals_dict = {}
        most_common = None
        max_cnt = 0
        for row in dism_rows:
            kind = row[0] or "unknown"
            cnt = int(row[1] or 0)
            dismissals_dict[kind] = cnt
            if cnt > max_cnt:
                max_cnt = cnt
                most_common = kind

        # Score distribution
        sd_rows = db.execute(text(
            "SELECT CASE WHEN inn_runs=0 THEN '0' WHEN inn_runs BETWEEN 1 AND 9 THEN '1-9' "
            "WHEN inn_runs BETWEEN 10 AND 19 THEN '10-19' WHEN inn_runs BETWEEN 20 AND 29 THEN '20-29' "
            "WHEN inn_runs BETWEEN 30 AND 49 THEN '30-49' WHEN inn_runs BETWEEN 50 AND 99 THEN '50-99' "
            "ELSE '100+' END AS sr, COUNT(*) "
            "FROM (SELECT d.match_id, i.id, SUM(d.runs_batter) AS inn_runs "
            "FROM deliveries d JOIN innings i ON i.id=d.innings_id "
            f"JOIN matches m ON m.id=d.match_id "
            f"WHERE d.batter=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
            "GROUP BY d.match_id, i.id) sub GROUP BY sr"
        ), {"name": name}).fetchall()
        ordered = ["0", "1-9", "10-19", "20-29", "30-49", "50-99", "100+"]
        sd_map = {r[0]: int(r[1] or 0) for r in sd_rows}
        score_distribution = {k: sd_map.get(k, 0) for k in ordered}

        # Phase batting
        pb_rows = db.execute(text(
            "SELECT d.phase, SUM(d.runs_batter), COUNT(*), "
            "SUM(CASE WHEN d.is_wicket AND d.player_out=:name THEN 1 ELSE 0 END) "
            "FROM deliveries d JOIN matches m ON m.id=d.match_id "
            f"WHERE d.batter=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
            "GROUP BY d.phase"
        ), {"name": name}).fetchall()
        phase_batting = {}
        most_vulnerable_phase = None
        max_dis = -1
        for row in pb_rows:
            phase = row[0] or "unknown"
            runs  = int(row[1] or 0)
            balls = int(row[2] or 0)
            dis   = int(row[3] or 0)
            phase_batting[phase] = {
                "runs": runs, "balls": balls,
                "strike_rate": round((runs/balls)*100, 2) if balls > 0 else 0.0,
                "dismissals": dis
            }
            if dis > max_dis:
                max_dis = dis
                most_vulnerable_phase = phase

        # --- BOWLING ---
        bwl = db.execute(text(
            "SELECT COUNT(DISTINCT d.match_id), COUNT(*), "
            "SUM(d.runs_batter + d.runs_extras), "
            f"SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN {NOT_OUT} THEN 1 ELSE 0 END), "
            "SUM(CASE WHEN d.runs_batter=0 AND d.runs_extras=0 THEN 1 ELSE 0 END) "
            "FROM deliveries d JOIN matches m ON m.id=d.match_id "
            f"WHERE d.bowler=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df}"
        ), {"name": name}).fetchone()

        bowling_overview = {}
        wicket_types = {}
        phase_bowling = {}

        if bwl and int(bwl[1] or 0) > 0:
            b_balls   = int(bwl[1] or 0)
            b_runs    = int(bwl[2] or 0)
            b_wickets = int(bwl[3] or 0)
            b_dots    = int(bwl[4] or 0)
            b_overs   = b_balls / 6
            economy   = round(b_runs / b_overs, 2) if b_overs > 0 else 0.0
            b_avg     = round(b_runs / b_wickets, 2) if b_wickets > 0 else 0.0
            b_sr      = round(b_balls / b_wickets, 2) if b_wickets > 0 else 0.0
            dot_pct   = round((b_dots / b_balls) * 100, 1) if b_balls > 0 else 0.0

            bf = db.execute(text(
                f"SELECT wkts, runs_c FROM ("
                f"SELECT SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN {NOT_OUT} THEN 1 ELSE 0 END) AS wkts, "
                f"SUM(d.runs_batter+d.runs_extras) AS runs_c "
                f"FROM deliveries d JOIN matches m ON m.id=d.match_id "
                f"WHERE d.bowler=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
                f"GROUP BY d.match_id) sub ORDER BY wkts DESC, runs_c ASC LIMIT 1"
            ), {"name": name}).fetchone()
            best_figures = f"{int(bf[0])}/{int(bf[1])}" if bf and bf[0] else "—"

            fw = db.execute(text(
                f"SELECT COUNT(*) FROM ("
                f"SELECT d.match_id, SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN {NOT_OUT} THEN 1 ELSE 0 END) AS wkts "
                f"FROM deliveries d JOIN matches m ON m.id=d.match_id "
                f"WHERE d.bowler=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
                f"GROUP BY d.match_id "
                f"HAVING SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN {NOT_OUT} THEN 1 ELSE 0 END) >= 5) sub"
            ), {"name": name}).fetchone()

            bowling_overview = {
                "matches": int(bwl[0] or 0), "wickets": b_wickets, "economy": economy,
                "average": b_avg, "bowling_sr": b_sr, "dot_pct": dot_pct,
                "best_figures": best_figures, "five_wickets": int(fw[0] or 0) if fw else 0,
            }

            wt_rows = db.execute(text(
                f"SELECT d.wicket_kind, COUNT(*) FROM deliveries d JOIN matches m ON m.id=d.match_id "
                f"WHERE d.bowler=:name AND d.is_wicket AND d.wicket_kind NOT IN {NOT_OUT} "
                f"AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
                f"GROUP BY d.wicket_kind ORDER BY COUNT(*) DESC"
            ), {"name": name}).fetchall()
            wicket_types = {r[0]: int(r[1]) for r in wt_rows if r[0]}

            pbl_rows = db.execute(text(
                f"SELECT d.phase, SUM(d.runs_batter+d.runs_extras), COUNT(*), "
                f"SUM(CASE WHEN d.is_wicket AND d.wicket_kind NOT IN {NOT_OUT} THEN 1 ELSE 0 END) "
                f"FROM deliveries d JOIN matches m ON m.id=d.match_id "
                f"WHERE d.bowler=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
                f"GROUP BY d.phase"
            ), {"name": name}).fetchall()
            for row in pbl_rows:
                phase = row[0] or "unknown"
                runs  = int(row[1] or 0)
                balls = int(row[2] or 0)
                wkts  = int(row[3] or 0)
                phase_bowling[phase] = {
                    "runs": runs, "balls": balls, "wickets": wkts,
                    "economy": round(runs / (balls/6), 2) if balls > 0 else 0.0
                }

        # Recent form
        recent_form = []
        try:
            rf_rows = db.execute(text(
                "SELECT m.date, CASE WHEN m.team1='Sri Lanka' THEN m.team2 ELSE m.team1 END, "
                "SUM(d.runs_batter), "
                "MAX(CASE WHEN d.is_wicket AND d.player_out=:name THEN d.wicket_kind ELSE NULL END) "
                "FROM deliveries d JOIN innings i ON i.id=d.innings_id "
                f"JOIN matches m ON m.id=d.match_id "
                f"WHERE d.batter=:name AND (m.team1='Sri Lanka' OR m.team2='Sri Lanka') {df} "
                "GROUP BY m.date, m.id, m.team1, m.team2 ORDER BY m.date DESC LIMIT 10"
            ), {"name": name}).fetchall()
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
            "name": name, "error": str(e),
            "batting_overview": {}, "bowling_overview": {},
            "dismissals": {}, "wicket_types": {},
            "score_distribution": {}, "phase_batting": {},
            "phase_bowling": {}, "recent_form": [], "is_active": False,
        }
