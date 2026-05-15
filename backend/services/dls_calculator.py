"""
dls_calculator.py
──────────────────
DLS (Duckworth-Lewis-Stern) rain interruption calculator.
Uses the Standard Edition resource table (publicly available).

For pre-match prediction only — uses venue par score as target.
Breaks down into 5-over milestones showing required scores.
"""

from sqlalchemy.orm import Session
from models.db_models import Venue
from services.analytics import get_venue_par_score
from typing import Optional, List

# ── DLS STANDARD RESOURCE TABLE (T20 — 20 overs) ──────────────────
# Source: ICC Standard Edition (publicly available)
# Format: {overs_remaining: [wkts_0, wkts_1, wkts_2, wkts_3,
#                            wkts_4, wkts_5, wkts_6, wkts_7, wkts_8, wkts_9]}
# Values are percentage of resources remaining

DLS_RESOURCE_TABLE = {
    20: [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9,  4.7],
    19: [ 96.0, 89.7, 81.8, 72.0, 60.3, 47.1, 33.6, 21.2, 11.5,  4.6],
    18: [ 92.0, 85.9, 78.3, 69.0, 57.8, 45.2, 32.3, 20.4, 11.1,  4.4],
    17: [ 87.9, 82.1, 74.9, 66.0, 55.4, 43.4, 31.0, 19.6, 10.7,  4.3],
    16: [ 83.8, 78.3, 71.5, 63.0, 52.9, 41.5, 29.7, 18.8, 10.3,  4.1],
    15: [ 79.6, 74.4, 68.0, 60.0, 50.5, 39.6, 28.4, 18.0,  9.9,  4.0],
    14: [ 75.4, 70.5, 64.5, 57.0, 48.0, 37.7, 27.1, 17.2,  9.5,  3.8],
    13: [ 71.1, 66.6, 61.0, 54.0, 45.5, 35.8, 25.8, 16.4,  9.0,  3.7],
    12: [ 66.7, 62.6, 57.4, 51.0, 43.0, 33.9, 24.5, 15.6,  8.6,  3.5],
    11: [ 62.2, 58.5, 53.8, 48.0, 40.5, 32.0, 23.2, 14.8,  8.2,  3.3],
    10: [ 57.7, 54.4, 50.1, 44.9, 38.0, 30.1, 21.9, 14.0,  7.8,  3.2],
     9: [ 53.1, 50.2, 46.3, 41.7, 35.4, 28.2, 20.6, 13.2,  7.3,  3.0],
     8: [ 48.4, 45.9, 42.5, 38.5, 32.8, 26.2, 19.2, 12.4,  6.9,  2.8],
     7: [ 43.6, 41.6, 38.6, 35.1, 30.1, 24.2, 17.8, 11.6,  6.5,  2.7],
     6: [ 38.7, 37.1, 34.5, 31.6, 27.3, 22.1, 16.4, 10.7,  6.0,  2.5],
     5: [ 33.7, 32.5, 30.4, 28.0, 24.4, 19.9, 14.9,  9.8,  5.6,  2.3],
     4: [ 28.6, 27.7, 26.1, 24.2, 21.4, 17.6, 13.3,  8.9,  5.1,  2.1],
     3: [ 23.3, 22.7, 21.5, 20.1, 18.0, 15.0, 11.5,  7.8,  4.5,  2.0],
     2: [ 17.8, 17.4, 16.6, 15.7, 14.3, 12.1,  9.4,  6.5,  3.9,  1.7],
     1: [ 11.9, 11.7, 11.3, 10.8,  9.9,  8.6,  6.8,  4.9,  3.0,  1.4],
     0: [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
}


def get_resource_pct(overs_remaining: int, wickets_lost: int) -> float:
    """Get resource percentage from DLS table."""
    overs_remaining = max(0, min(20, overs_remaining))
    wickets_lost = max(0, min(9, wickets_lost))
    row = DLS_RESOURCE_TABLE.get(overs_remaining, [0.0] * 10)
    return row[wickets_lost]


def calculate_par_score_at_stage(
    target: float,
    overs_completed: float,
    wickets_lost: int,
    total_overs: int = 20,
) -> float:
    """
    Calculate DLS par score at a given match stage.
    par_score = target × (resources_used / total_resources)
    """
    overs_remaining = total_overs - overs_completed
    resources_used = 100.0 - get_resource_pct(int(overs_remaining), wickets_lost)
    par = target * (resources_used / 100.0)
    return round(par, 1)


def generate_milestone_table(
    target: float,
    total_overs: int = 20,
    interval: int = 5,
) -> List[dict]:
    """
    Generate par score milestones at every N overs.
    Shows what score the batting team should be at.
    """
    milestones = []

    for over in range(0, total_overs + 1, interval):
        if over == 0:
            continue
        overs_remaining = total_overs - over
        milestone = {
            "after_over": over,
            "overs_remaining": overs_remaining,
        }

        # Par scores for different wicket states
        wicket_scenarios = {}
        for wkts in [0, 2, 4, 6, 8]:
            par = calculate_par_score_at_stage(target, over, wkts, total_overs)
            runs_needed = max(0, round(target - par))
            overs_left = total_overs - over
            rrr = round(runs_needed / overs_left, 2) if overs_left > 0 else 0

            wicket_scenarios[f"{wkts}_wickets_down"] = {
                "par_score": par,
                "runs_needed": runs_needed,
                "required_run_rate": rrr,
            }

        milestone["wicket_scenarios"] = wicket_scenarios
        milestone["par_score_0_wkts"] = wicket_scenarios["0_wickets_down"]["par_score"]
        milestones.append(milestone)

    return milestones


def calculate_dls(
    db: Session,
    venue_name: str,
    sl_role: str,
    opponent_team: str,
    playing_xi: List[str],
    overs_available: Optional[int] = None,
) -> dict:
    """
    Main DLS pre-match prediction calculator.

    Since this is pre-match (no live data), we:
    1. Use venue opponent-adjusted par score as target
    2. Generate 5-over milestone table
    3. Show strategic recommendations
    4. Display playing XI in batting order context
    """
    # Get venue
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    if not venue:
        return {"error": f"Venue '{venue_name}' not found"}

    # Get opponent-adjusted par score
    par_data = get_venue_par_score(
        db, venue.id,
        sl_role="batting" if sl_role == "batting_first" else "bowling",
        opponent_team=opponent_team,
    )

    target = par_data["recommended"]["par_score"]
    par_source = par_data["recommended"]["source"]
    par_confidence = par_data["recommended"]["confidence"]

    if target == 0:
        return {"error": "Insufficient venue data to calculate par score"}

    total_overs = overs_available or 20

    # Generate milestone table
    milestones = generate_milestone_table(target, total_overs, interval=5)

    # Strategic recommendations based on role
    strategy = []
    batting_order = []

    if sl_role == "batting_first":
        strategy.append(f"🏏 SL batting first — target: {target} runs in {total_overs} overs")
        strategy.append(f"Required run rate: {round(target/total_overs, 2)} per over")
        strategy.append("If rain interrupts — stay ahead of DLS par score at all times")
        strategy.append(f"Key milestone: By over 10, target {milestones[1]['par_score_0_wkts']} runs (0 wkts)")

        # Batting order from XI
        batting_order = [
            {"position": i+1, "player": name, "role": "Batter" if i < 7 else "Bowler"}
            for i, name in enumerate(playing_xi)
        ]

    else:  # bowling_first / chasing
        chase_target = target + 1
        strategy.append(f"🏏 SL chasing — need {chase_target} runs in {total_overs} overs")
        strategy.append(f"Required run rate: {round(chase_target/total_overs, 2)} per over")
        strategy.append("If rain interrupts — be aware of DLS par score. Stay ahead of it")
        strategy.append(f"Key milestone: By over 10, need {milestones[1]['par_score_0_wkts']+1} runs (0 wkts) to be ahead of par")

        batting_order = [
            {"position": i+1, "player": name, "role": "Batter" if i < 7 else "Bowler"}
            for i, name in enumerate(playing_xi)
        ]

    # DLS Note
    dls_note = (
        "This calculator uses the ICC Standard Edition DLS resource table. "
        "The par score is based on venue historical data, adjusted for the specific opponent. "
        "Actual DLS calculations in live matches use the ICC Professional Edition software."
    )

    return {
        "venue": venue_name,
        "opponent": opponent_team,
        "sl_role": sl_role,
        "total_overs": total_overs,

        "par_score": {
            "value": target,
            "source": par_source,
            "confidence": par_confidence,
            "all_estimates": {
                "overall_venue_avg": par_data["overall_venue_average"]["par_score"],
                "sl_at_venue": par_data["sl_at_venue"]["par_score"],
                "sl_vs_opponent": par_data.get("sl_vs_opponent_at_venue", {}).get("par_score", "N/A"),
            },
        },

        "milestone_table": milestones,

        "strategy": strategy,

        "playing_xi": {
            "players": playing_xi,
            "batting_order": batting_order,
            "total_players": len(playing_xi),
        },

        "dls_note": dls_note,
    }
