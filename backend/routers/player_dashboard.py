"""
Player Dashboard Router — CrickSL
GET /players/dashboard/list  → filtered player list with era + role
GET /players/dashboard/{name} → full player stats dashboard
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.db_models import Player, Delivery, Match, Innings
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/players/dashboard", tags=["Player Dashboard"])


def get_cutoff(years):
    if years == 0:
        return None
    return datetime.now().date() - timedelta(days=years * 365)


def get_match_ids(db, years):
    q = db.query(Match.id)
    cutoff = get_cutoff(years)
    if cutoff:
        q = q.filter(Match.date >= cutoff)
    return [m.id for m in q.all()]


@router.get("/list")
def player_list(
    role: Optional[str] = Query(None, description="batter/bowler/allrounder/keeper"),
    years: int = Query(0, description="0=all time, 3/5/10=last N years"),
    db: Session = Depends(get_db)
):
    q = db.query(Player).filter(Player.nationality == "Sri Lanka")

    if role and role != "all":
        role_map = {
            "batter":    ["Batter", "Wicket Keeper Batter"],
            "bowler":    ["Bowler"],
            "allrounder":["All Rounder"],
            "keeper":    ["Wicket Keeper Batter"],
        }
        roles = role_map.get(role, [])
        if roles:
            from sqlalchemy import or_
            q = q.filter(or_(*[Player.player_role == r for r in roles]))

    players = q.order_by(Player.name).all()

    # Get match date range for each player to determine active/legend
    result = []
    cutoff = get_cutoff(years)
    three_yr_cutoff = datetime.now().date() - timedelta(days=3 * 365)

    for p in players:
        # Check if player has any deliveries
        dq = db.query(func.max(Match.date)).join(
            Delivery, Delivery.match_id == Match.id
        ).filter(
            (Delivery.batter == p.name) | (Delivery.bowler == p.name)
        )
        if cutoff:
            dq = dq.filter(Match.date >= cutoff)

        last_date = dq.scalar()

        if not last_date:
            continue  # skip players with no data in selected era

        # Determine badge
        is_active = last_date >= three_yr_cutoff
        badge = "Active" if is_active else "Legend"

        result.append({
            "name": p.name,
            "role": p.player_role,
            "batting_style": p.batting_style,
            "bowling_style": p.bowling_style,
            "badge": badge,
            "last_active": str(last_date),
        })

    return sorted(result, key=lambda x: (x["badge"] != "Active", x["name"]))


@router.get("/{player_name}")
def player_dashboard(
    player_name: str,
    years: int = Query(0, description="0=all time, 3/5/10=last N years"),
    db: Session = Depends(get_db)
):
    # Get player metadata
    player = db.query(Player).filter(Player.name == player_name).first()

    # Get match IDs for era filter
    cutoff = get_cutoff(years)
    mq = db.query(Match.id)
    if cutoff:
        mq = mq.filter(Match.date >= cutoff)
    mids = [m.id for m in mq.all()]

    if not mids:
        return {"player_name": player_name, "error": "No data for selected period"}

    # ─── BATTING STATS ─────────────────────────────────────────────
    bat_deliveries = db.query(Delivery).join(
        Innings, Delivery.innings_id == Innings.id
    ).filter(
        Delivery.match_id.in_(mids),
        Delivery.batter == player_name,
        Delivery.is_wide == False,
    ).all()

    # Build innings-level data
    innings_map = {}
    for d in bat_deliveries:
        key = (d.match_id, d.innings_id)
        if key not in innings_map:
            innings_map[key] = {"runs": 0, "balls": 0, "dismissed": False,
                                "dismissal_type": None, "phase_dismissed": None}
        innings_map[key]["runs"] += d.runs_batter
        innings_map[key]["balls"] += 1

    # Get dismissals
    dismissals = db.query(Delivery).filter(
        Delivery.match_id.in_(mids),
        Delivery.player_out == player_name,
        Delivery.is_wicket == True,
    ).all()

    dismissal_types = {}
    for d in dismissals:
        key = (d.match_id, d.innings_id)
        if key in innings_map:
            innings_map[key]["dismissed"] = True
            innings_map[key]["dismissal_type"] = d.wicket_kind or "unknown"
            innings_map[key]["phase_dismissed"] = d.phase
        wk = d.wicket_kind or "unknown"
        dismissal_types[wk] = dismissal_types.get(wk, 0) + 1

    innings_list = list(innings_map.values())
    total_innings = len(innings_list)
    total_runs = sum(i["runs"] for i in innings_list)
    not_outs = sum(1 for i in innings_list if not i["dismissed"])
    dismissed_count = total_innings - not_outs
    ducks = sum(1 for i in innings_list if i["runs"] == 0 and i["dismissed"])
    golden_ducks = sum(1 for i in innings_list if i["runs"] == 0 and i["balls"] <= 1 and i["dismissed"])
    highest = max((i["runs"] for i in innings_list), default=0)
    fifties = sum(1 for i in innings_list if 50 <= i["runs"] < 100)
    hundreds = sum(1 for i in innings_list if i["runs"] >= 100)
    average = round(total_runs / dismissed_count, 2) if dismissed_count else float(total_runs)
    total_balls = sum(i["balls"] for i in innings_list)
    strike_rate = round(total_runs / total_balls * 100, 2) if total_balls else 0
    boundaries = sum(1 for d in bat_deliveries if d.is_boundary_four or d.is_boundary_six)
    dots = sum(1 for d in bat_deliveries if d.runs_batter == 0)
    boundary_pct = round(boundaries / total_balls * 100, 1) if total_balls else 0
    dot_pct = round(dots / total_balls * 100, 1) if total_balls else 0

    # Score distribution
    score_dist = {"0": 0, "1-9": 0, "10-19": 0, "20-29": 0, "30-49": 0, "50-99": 0, "100+": 0}
    for i in innings_list:
        r = i["runs"]
        if r == 0: score_dist["0"] += 1
        elif r < 10: score_dist["1-9"] += 1
        elif r < 20: score_dist["10-19"] += 1
        elif r < 30: score_dist["20-29"] += 1
        elif r < 50: score_dist["30-49"] += 1
        elif r < 100: score_dist["50-99"] += 1
        else: score_dist["100+"] += 1

    # Phase performance (batting SR)
    phase_bat = {}
    for d in bat_deliveries:
        ph = d.phase or "unknown"
        if ph not in phase_bat:
            phase_bat[ph] = {"runs": 0, "balls": 0}
        phase_bat[ph]["runs"] += d.runs_batter
        phase_bat[ph]["balls"] += 1
    phase_bat_sr = {
        ph: round(v["runs"] / v["balls"] * 100, 1) if v["balls"] else 0
        for ph, v in phase_bat.items()
    }

    # Phase dismissals
    phase_dismissed = {}
    for i in innings_list:
        if i["dismissed"] and i["phase_dismissed"]:
            ph = i["phase_dismissed"]
            phase_dismissed[ph] = phase_dismissed.get(ph, 0) + 1

    # ─── BOWLING STATS ─────────────────────────────────────────────
    bowl_deliveries = db.query(Delivery).filter(
        Delivery.match_id.in_(mids),
        Delivery.bowler == player_name,
    ).all()

    wkts = sum(1 for d in bowl_deliveries if d.is_wicket and d.wicket_kind not in ["run out"])
    legal = [d for d in bowl_deliveries if not d.is_wide and not d.is_noball]
    bowl_runs = sum(d.runs_total for d in bowl_deliveries if not d.is_bye and not d.is_legbye)
    bowl_balls = len(legal)
    overs = bowl_balls / 6
    economy = round(bowl_runs / overs, 2) if overs else 0
    bowl_avg = round(bowl_runs / wkts, 2) if wkts else 0
    bowl_sr = round(bowl_balls / wkts, 1) if wkts else 0
    bowl_dots = sum(1 for d in legal if d.runs_total == 0)
    bowl_dot_pct = round(bowl_dots / bowl_balls * 100, 1) if bowl_balls else 0

    # Wicket types
    wicket_types = {}
    for d in bowl_deliveries:
        if d.is_wicket and d.wicket_kind and d.wicket_kind != "run out":
            wicket_types[d.wicket_kind] = wicket_types.get(d.wicket_kind, 0) + 1

    # Phase economy
    phase_bowl = {}
    for d in bowl_deliveries:
        ph = d.phase or "unknown"
        if ph not in phase_bowl:
            phase_bowl[ph] = {"runs": 0, "balls": 0, "wickets": 0}
        if not d.is_wide and not d.is_noball:
            phase_bowl[ph]["balls"] += 1
        if not d.is_bye and not d.is_legbye:
            phase_bowl[ph]["runs"] += d.runs_total
        if d.is_wicket and d.wicket_kind not in ["run out"]:
            phase_bowl[ph]["wickets"] += 1

    phase_bowl_eco = {
        ph: round(v["runs"] / (v["balls"] / 6), 2) if v["balls"] >= 6 else None
        for ph, v in phase_bowl.items()
    }

    # Last active date
    last_match = db.query(func.max(Match.date)).join(
        Delivery, Delivery.match_id == Match.id
    ).filter(
        Delivery.match_id.in_(mids),
        (Delivery.batter == player_name) | (Delivery.bowler == player_name)
    ).scalar()

    three_yr = datetime.now().date() - timedelta(days=3 * 365)
    badge = "Active" if (last_match and last_match >= three_yr) else "Legend"

    return {
        "player_name": player_name,
        "role": player.player_role if player else None,
        "batting_style": player.batting_style if player else None,
        "bowling_style": player.bowling_style if player else None,
        "badge": badge,
        "last_active": str(last_match) if last_match else None,
        "years_filter": years,

        "batting": {
            "matches": len(set(m for m, _ in innings_map.keys())),
            "innings": total_innings,
            "runs": total_runs,
            "not_outs": not_outs,
            "average": average,
            "strike_rate": strike_rate,
            "highest_score": highest,
            "fifties": fifties,
            "hundreds": hundreds,
            "ducks": ducks,
            "golden_ducks": golden_ducks,
            "duck_pct": round(ducks / total_innings * 100, 1) if total_innings else 0,
            "boundary_pct": boundary_pct,
            "dot_pct": dot_pct,
            "dismissal_types": dismissal_types,
            "score_distribution": score_dist,
            "phase_strike_rate": phase_bat_sr,
            "phase_dismissals": phase_dismissed,
        },

        "bowling": {
            "innings": len(set(d.innings_id for d in bowl_deliveries)),
            "wickets": wkts,
            "economy": economy,
            "average": bowl_avg,
            "strike_rate": bowl_sr,
            "dot_pct": bowl_dot_pct,
            "wicket_types": wicket_types,
            "phase_economy": phase_bowl_eco,
        }
    }
