"""
analytics.py
────────────
All data analysis functions. These are called by routers.
Pure SQL via SQLAlchemy — no pandas at runtime (data is already in DB).
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func
from models.db_models import Match, Innings, Delivery, Venue, Player
from models.schemas import (
    VenueStats, PhaseStats, BattingStats, BowlingStats,
    TopBatter, TopBowler
)
from typing import List, Optional


# ── VENUE ANALYTICS ────────────────────────────────────────────────────

def get_venue_stats(db: Session, venue_id: int) -> Optional[VenueStats]:
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        return None

    # All matches at this venue (exclude no result)
    matches = db.query(Match).filter(
        Match.venue_id == venue_id,
        Match.no_result == False,
        Match.winner != None
    ).all()

    if not matches:
        return VenueStats(
            venue_id=venue_id, venue_name=venue.name,
            total_matches=0, avg_first_innings_score=0, avg_second_innings_score=0,
            bat_first_wins=0, chase_wins=0, bat_first_win_pct=0, chase_win_pct=0,
            toss_recommendation="insufficient data"
        )

    match_ids = [m.id for m in matches]

    # Average 1st and 2nd innings scores
    inn_scores = db.query(Innings).filter(Innings.match_id.in_(match_ids)).all()
    first_scores = [i.total_runs for i in inn_scores if i.innings_number == 1]
    second_scores = [i.total_runs for i in inn_scores if i.innings_number == 2]

    avg_first = sum(first_scores) / len(first_scores) if first_scores else 0
    avg_second = sum(second_scores) / len(second_scores) if second_scores else 0

    # Bat first vs chase wins
    bat_first_wins = 0
    chase_wins = 0

    for m in matches:
        if not m.winner or not m.toss_decision:
            continue

        toss_winner_batted = (
            (m.toss_winner == m.winner and m.toss_decision == "bat") or
            (m.toss_winner != m.winner and m.toss_decision == "field")
        )
        # Who actually batted first?
        # toss_decision "bat" means toss winner batted first
        # toss_decision "field" means toss winner fielded first
        first_batting_team = m.toss_winner if m.toss_decision == "bat" else (
            m.team2 if m.toss_winner == m.team1 else m.team1
        )
        if m.winner == first_batting_team:
            bat_first_wins += 1
        else:
            chase_wins += 1

    total = bat_first_wins + chase_wins
    bat_first_pct = round(bat_first_wins / total * 100, 1) if total else 0
    chase_pct = round(chase_wins / total * 100, 1) if total else 0

    recommendation = "bat first" if bat_first_pct >= chase_pct else "field first (chase)"

    return VenueStats(
        venue_id=venue_id,
        venue_name=venue.name,
        total_matches=len(matches),
        avg_first_innings_score=round(avg_first, 1),
        avg_second_innings_score=round(avg_second, 1),
        bat_first_wins=bat_first_wins,
        chase_wins=chase_wins,
        bat_first_win_pct=bat_first_pct,
        chase_win_pct=chase_pct,
        toss_recommendation=recommendation,
    )


def get_venue_phase_stats(db: Session, venue_id: int) -> List[PhaseStats]:
    """Average runs and wickets per over in each phase at this venue."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        return []

    match_ids = [
        m.id for m in db.query(Match.id).filter(Match.venue_id == venue_id).all()
    ]
    if not match_ids:
        return []

    results = []
    for phase in ["powerplay", "middle", "death"]:
        deliveries = db.query(Delivery).filter(
            Delivery.match_id.in_(match_ids),
            Delivery.phase == phase,
            Delivery.is_wide == False,
            Delivery.is_noball == False,
        ).all()

        if not deliveries:
            results.append(PhaseStats(phase=phase, avg_runs=0, avg_wickets=0, total_deliveries=0))
            continue

        total_runs = sum(d.runs_total for d in deliveries)
        total_wickets = sum(1 for d in deliveries if d.is_wicket)
        # per-over averages
        overs_in_phase = {"powerplay": 6, "middle": 9, "death": 5}
        matches_count = len(match_ids)
        estimated_overs = overs_in_phase[phase] * matches_count

        results.append(PhaseStats(
            phase=phase,
            avg_runs=round(total_runs / estimated_overs, 2) if estimated_overs else 0,
            avg_wickets=round(total_wickets / estimated_overs, 2) if estimated_overs else 0,
            total_deliveries=len(deliveries),
        ))

    return results


# ── PLAYER ANALYTICS ───────────────────────────────────────────────────

def get_batting_stats(db: Session, player_name: str, venue_id: Optional[int] = None) -> Optional[BattingStats]:
    query = db.query(Delivery).filter(
        Delivery.batter == player_name,
        Delivery.is_wide == False,   # wides don't count as balls faced
    )
    if venue_id:
        match_ids = [m.id for m in db.query(Match.id).filter(Match.venue_id == venue_id).all()]
        query = query.filter(Delivery.match_id.in_(match_ids))

    deliveries = query.all()
    if not deliveries:
        return None

    # Innings count = unique (match_id, innings_number) where player batted
    innings_set = set()
    for d in deliveries:
        innings_set.add((d.match_id, d.innings_id))

    total_runs = sum(d.runs_batter for d in deliveries)
    balls_faced = len(deliveries)
    boundaries_4 = sum(1 for d in deliveries if d.is_boundary_four)
    boundaries_6 = sum(1 for d in deliveries if d.is_boundary_six)
    dot_balls = sum(1 for d in deliveries if d.runs_batter == 0)
    wickets = [d for d in db.query(Delivery).filter(
        Delivery.player_out == player_name
    ).all()]

    dismissals = len(wickets)
    innings_count = len(innings_set)

    average = round(total_runs / dismissals, 2) if dismissals else float(total_runs)
    strike_rate = round(total_runs / balls_faced * 100, 2) if balls_faced else 0
    boundary_pct = round((boundaries_4 + boundaries_6) / balls_faced * 100, 1) if balls_faced else 0
    dot_pct = round(dot_balls / balls_faced * 100, 1) if balls_faced else 0

    # Highest score per innings
    innings_runs = {}
    for d in deliveries:
        key = (d.match_id, d.innings_id)
        innings_runs[key] = innings_runs.get(key, 0) + d.runs_batter
    highest = max(innings_runs.values()) if innings_runs else 0
    fifties = sum(1 for r in innings_runs.values() if 50 <= r < 100)
    hundreds = sum(1 for r in innings_runs.values() if r >= 100)

    return BattingStats(
        player_name=player_name,
        innings=innings_count,
        total_runs=total_runs,
        average=average,
        strike_rate=strike_rate,
        boundary_pct=boundary_pct,
        dot_ball_pct=dot_pct,
        highest_score=highest,
        fifties=fifties,
        hundreds=hundreds,
    )


def get_bowling_stats(db: Session, player_name: str, venue_id: Optional[int] = None) -> Optional[BowlingStats]:
    query = db.query(Delivery).filter(Delivery.bowler == player_name)
    if venue_id:
        match_ids = [m.id for m in db.query(Match.id).filter(Match.venue_id == venue_id).all()]
        query = query.filter(Delivery.match_id.in_(match_ids))

    deliveries = query.all()
    if not deliveries:
        return None

    innings_set = set((d.match_id, d.innings_id) for d in deliveries)
    # Legal deliveries (exclude wides and no balls for SR)
    legal = [d for d in deliveries if not d.is_wide and not d.is_noball]
    total_runs_conceded = sum(d.runs_total for d in deliveries if not d.is_bye and not d.is_legbye)
    wickets = sum(1 for d in deliveries if d.is_wicket and d.wicket_kind not in ["run out"])
    balls_bowled = len(legal)
    overs_bowled = balls_bowled / 6

    economy = round(total_runs_conceded / overs_bowled, 2) if overs_bowled else 0
    bowling_sr = round(balls_bowled / wickets, 1) if wickets else None
    avg = round(total_runs_conceded / wickets, 2) if wickets else None
    dot_balls = sum(1 for d in legal if d.runs_total == 0)
    dot_pct = round(dot_balls / balls_bowled * 100, 1) if balls_bowled else 0

    return BowlingStats(
        player_name=player_name,
        innings=len(innings_set),
        wickets=wickets,
        economy=economy,
        bowling_strike_rate=bowling_sr,
        dot_ball_pct=dot_pct,
        average=avg,
    )


def get_top_batters_at_venue(db: Session, team: str, venue_id: int, limit: int = 5) -> List[TopBatter]:
    """Top batters of a team at a specific venue."""
    match_ids = [
        m.id for m in db.query(Match.id).filter(
            Match.venue_id == venue_id,
            (Match.team1 == team) | (Match.team2 == team)
        ).all()
    ]
    if not match_ids:
        return []

    deliveries = db.query(Delivery).filter(
        Delivery.match_id.in_(match_ids),
        Delivery.batting_team == team,
        Delivery.is_wide == False,
    ).all()

    # Aggregate by batter
    stats = {}
    for d in deliveries:
        if d.batter not in stats:
            stats[d.batter] = {"runs": 0, "balls": 0, "innings": set()}
        stats[d.batter]["runs"] += d.runs_batter
        stats[d.batter]["balls"] += 1
        stats[d.batter]["innings"].add((d.match_id, d.innings_id))

    result = []
    for name, s in stats.items():
        if s["balls"] < 10:   # minimum balls filter
            continue
        inn_count = len(s["innings"])
        result.append(TopBatter(
            name=name,
            runs=s["runs"],
            average=round(s["runs"] / inn_count, 1) if inn_count else 0,
            strike_rate=round(s["runs"] / s["balls"] * 100, 1) if s["balls"] else 0,
        ))

    result.sort(key=lambda x: x.runs, reverse=True)
    return result[:limit]


def get_top_bowlers_at_venue(db: Session, team: str, venue_id: int, limit: int = 5) -> List[TopBowler]:
    """Top bowlers of a team at a specific venue."""
    match_ids = [
        m.id for m in db.query(Match.id).filter(
            Match.venue_id == venue_id,
            (Match.team1 == team) | (Match.team2 == team)
        ).all()
    ]
    if not match_ids:
        return []

    deliveries = db.query(Delivery).filter(
        Delivery.match_id.in_(match_ids),
        Delivery.bowling_team == team,
    ).all()

    stats = {}
    for d in deliveries:
        if d.bowler not in stats:
            stats[d.bowler] = {"runs": 0, "balls": 0, "wickets": 0}
        if not d.is_wide and not d.is_noball:
            stats[d.bowler]["balls"] += 1
        if not d.is_bye and not d.is_legbye:
            stats[d.bowler]["runs"] += d.runs_total
        if d.is_wicket and d.wicket_kind not in ["run out"]:
            stats[d.bowler]["wickets"] += 1

    result = []
    for name, s in stats.items():
        if s["balls"] < 12:
            continue
        overs = s["balls"] / 6
        result.append(TopBowler(
            name=name,
            wickets=s["wickets"],
            economy=round(s["runs"] / overs, 2) if overs else 0,
        ))

    result.sort(key=lambda x: x.wickets, reverse=True)
    return result[:limit]
