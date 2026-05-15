"""
xi_recommender.py
─────────────────
Playing XI recommendation engine for CrickSL v2.0

Active Player Filtering (Two Layers):
  Layer 1: Played for SL in last 3 years (rolling from today)
  Layer 2: Appeared in at least 1 of last 10 SL matches

Retired player stats remain in DB and contribute to all
venue/phase analytics — only excluded from XI selection.
"""

from sqlalchemy.orm import Session
from models.db_models import Player, Delivery, Match, Venue
from typing import List, Optional, Dict
from dataclasses import dataclass, field
from datetime import date, timedelta


def get_active_sl_players(db: Session) -> List[str]:
    """
    Returns list of active SL player names using two-layer filter.
    Layer 1: Played for SL in last 3 years (rolling from today)
    Layer 2: Appeared in at least 1 of last 10 SL matches
    """
    cutoff_date = date.today() - timedelta(days=3 * 365)

    # Layer 1: Last 3 years
    # Strict filter: "Sri Lanka" only — excludes "Sri Lanka Women"
    recent_sl_match_ids = [
        m.id for m in db.query(Match).filter(
            (Match.team1 == "Sri Lanka") | (Match.team2 == "Sri Lanka"),
            Match.date >= cutoff_date,
            Match.no_result == False,
        ).all()
    ]

    if not recent_sl_match_ids:
        return []

    # Get innings where SL was batting/bowling
    from models.db_models import Innings
    sl_batting_innings = [
        i.id for i in db.query(Innings).filter(
            Innings.match_id.in_(recent_sl_match_ids),
            Innings.batting_team == "Sri Lanka",
        ).all()
    ]
    sl_bowling_innings = [
        i.id for i in db.query(Innings).filter(
            Innings.match_id.in_(recent_sl_match_ids),
            Innings.bowling_team == "Sri Lanka",
        ).all()
    ]
    batters_3yr = set(
        b.batter for b in db.query(Delivery.batter).filter(
            Delivery.innings_id.in_(sl_batting_innings),
        ).distinct().all()
    )
    bowlers_3yr = set(
        b.bowler for b in db.query(Delivery.bowler).filter(
            Delivery.innings_id.in_(sl_bowling_innings),
        ).distinct().all()
    )
    layer1 = batters_3yr | bowlers_3yr

    # Layer 2: Last 10 SL matches
    last_10_ids = [
        m.id for m in db.query(Match).filter(
            (Match.team1 == "Sri Lanka") | (Match.team2 == "Sri Lanka"),
            Match.winner != None,
            Match.no_result == False,
        ).order_by(Match.date.desc()).limit(10).all()
    ]

    sl_bat_inn_10 = [
        i.id for i in db.query(Innings).filter(
            Innings.match_id.in_(last_10_ids),
            Innings.batting_team == "Sri Lanka",
        ).all()
    ]
    sl_bowl_inn_10 = [
        i.id for i in db.query(Innings).filter(
            Innings.match_id.in_(last_10_ids),
            Innings.bowling_team == "Sri Lanka",
        ).all()
    ]
    batters_10 = set(
        b.batter for b in db.query(Delivery.batter).filter(
            Delivery.innings_id.in_(sl_bat_inn_10),
        ).distinct().all()
    )
    bowlers_10 = set(
        b.bowler for b in db.query(Delivery.bowler).filter(
            Delivery.innings_id.in_(sl_bowl_inn_10),
        ).distinct().all()
    )
    layer2 = batters_10 | bowlers_10

    active = layer1 & layer2
    print(f"   Active pool — 3yr: {len(layer1)}, last 10 matches: {len(layer2)}, final: {len(active)}")
    return list(active)


def get_active_players_with_metadata(db: Session) -> list:
    """
    Returns Player objects for active SL players WITH metadata only.
    Players without metadata are excluded — this naturally filters out
    women players since players_metadata.csv only contains men's players.
    """
    active_names = get_active_sl_players(db)
    if not active_names:
        return []

    players_with_meta = db.query(Player).filter(
        Player.name.in_(active_names),
        Player.nationality == "Sri Lanka",
        Player.player_role != None,
        Player.batting_style != None,
    ).all()

    print(f"   Players with metadata in active pool: {len(players_with_meta)}")
    return players_with_meta


@dataclass
class PlayerScore:
    name: str
    role: str
    batting_style: str
    bowling_style: Optional[str]
    nationality: str
    total_score: float = 0.0
    venue_score: float = 0.0
    form_score: float = 0.0
    matchup_score: float = 0.0
    reasons: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    stats: Dict = field(default_factory=dict)


def get_player_venue_score(db: Session, player_name: str, venue_id: int) -> tuple:
    match_ids = [m.id for m in db.query(Match.id).filter(Match.venue_id == venue_id).all()]
    bat_d = db.query(Delivery).filter(
        Delivery.batter == player_name,
        Delivery.match_id.in_(match_ids),
        Delivery.is_wide == False,
    ).all()
    bowl_d = db.query(Delivery).filter(
        Delivery.bowler == player_name,
        Delivery.match_id.in_(match_ids),
    ).all()

    stats = {}
    bat_score = 0.0
    bowl_score = 0.0

    if len(bat_d) >= 10:
        runs = sum(d.runs_batter for d in bat_d)
        balls = len(bat_d)
        sr = runs / balls * 100
        dismissals = len([d for d in db.query(Delivery).filter(
            Delivery.player_out == player_name,
            Delivery.match_id.in_(match_ids),
        ).all()])
        avg = runs / dismissals if dismissals else runs
        bat_score = min(10, (sr / 130 * 5) + (avg / 30 * 5))
        stats["venue_batting"] = {"runs": runs, "balls": balls, "strike_rate": round(sr, 1), "average": round(avg, 1)}

    if len(bowl_d) >= 12:
        legal = [d for d in bowl_d if not d.is_wide and not d.is_noball]
        runs_c = sum(d.runs_total for d in bowl_d if not d.is_bye and not d.is_legbye)
        wkts = sum(1 for d in bowl_d if d.is_wicket and d.wicket_kind not in ["run out"])
        overs = len(legal) / 6
        econ = runs_c / overs if overs else 0
        bowl_score = min(10, (max(0, 10 - econ) / 10 * 5) + (wkts / max(1, overs) * 2))
        stats["venue_bowling"] = {"wickets": wkts, "economy": round(econ, 2), "overs": round(overs, 1)}

    return max(bat_score, bowl_score), stats


def get_player_recent_form(db: Session, player_name: str) -> float:
    cutoff = date.today() - timedelta(days=3 * 365)
    recent = db.query(Delivery).filter(
        Delivery.batter == player_name,
        Delivery.is_wide == False,
        Delivery.match_id.in_(
            db.query(Match.id).filter(Match.date >= cutoff)
        ),
    ).order_by(Delivery.match_id.desc()).limit(150).all()

    if not recent:
        return 5.0
    runs = sum(d.runs_batter for d in recent)
    balls = len(recent)
    sr = runs / balls * 100 if balls else 0
    return min(10, sr / 130 * 10)


def analyze_opponent_xi(db: Session, opponent_players: List[str]) -> Dict:
    bowler_types = {}
    batter_types = {"Right Hand": 0, "Left Hand": 0}

    for name in opponent_players:
        player = db.query(Player).filter(Player.name == name).first()
        if not player:
            parts = name.split()
            if parts:
                candidates = db.query(Player).filter(Player.name.ilike(f"%{parts[-1]}%")).all()
                player = candidates[0] if len(candidates) == 1 else None

        if player:
            if player.batting_style:
                batter_types[player.batting_style] = batter_types.get(player.batting_style, 0) + 1
            if player.bowling_style and player.bowling_style.lower() not in ["none", "nan", ""]:
                s = player.bowling_style
                if "Fast" in s or "Medium" in s:
                    cat = "Pace"
                elif "Orthodox" in s or "Off Break" in s:
                    cat = "Spin (Off/Orthodox)"
                elif "Leg Break" in s or "Wrist" in s:
                    cat = "Spin (Leg/Wrist)"
                else:
                    cat = "Other"
                bowler_types[cat] = bowler_types.get(cat, 0) + 1

    dominant = max(bowler_types, key=bowler_types.get) if bowler_types else "Unknown"
    return {
        "bowler_types": bowler_types,
        "batter_types": batter_types,
        "dominant_bowling_threat": dominant,
        "right_hand_heavy_batting": batter_types.get("Right Hand", 0) > batter_types.get("Left Hand", 0),
        "total_analyzed": len(opponent_players),
    }


def calculate_matchup_score(player: Player, opp: Dict, is_batter: bool) -> tuple:
    score = 5.0
    reasons = []
    warnings = []
    dominant = opp.get("dominant_bowling_threat", "Unknown")
    right_heavy = opp.get("right_hand_heavy_batting", True)

    if is_batter and player.batting_style:
        if player.batting_style == "Left Hand":
            score += 1.5
            reasons.append("Left-hand batter disrupts field placement")
        if "Spin" in dominant:
            score += 1.0
            reasons.append("Opponent uses spin — opportunity for aggressive batters")

    if not is_batter and player.bowling_style:
        if "Left" in str(player.bowling_style) and right_heavy:
            score += 2.0
            reasons.append("Left-arm bowler has angle advantage vs right-hand heavy lineup")
        if any(s in str(player.bowling_style) for s in ["Orthodox", "Off Break", "Leg Break"]) and right_heavy:
            score += 1.5
            reasons.append("Spin effective against right-hand dominant batting lineup")
        if any(s in str(player.bowling_style) for s in ["Fast", "Medium"]):
            score += 1.0
            reasons.append("Pace adds variety to bowling attack")

    return score, reasons, warnings


def recommend_xi(db: Session, venue_name: str, opponent_team: str, opponent_xi: List[str]) -> Dict:
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    venue_id = venue.id if venue else None

    print(f"\n🏏 Fetching active SL players (last 3 years + last 10 matches)...")
    sl_players = get_active_players_with_metadata(db)

    if not sl_players:
        return {"error": "No active SL players found. Check match data is loaded."}

    opp_analysis = analyze_opponent_xi(db, opponent_xi)
    scored = []

    for player in sl_players:
        ps = PlayerScore(
            name=player.name,
            role=player.player_role or "Batter",
            batting_style=player.batting_style or "Right Hand",
            bowling_style=player.bowling_style,
            nationality="Sri Lanka",
        )
        vs, vstats = get_player_venue_score(db, player.name, venue_id) if venue_id else (5.0, {})
        ps.venue_score = vs
        ps.stats.update(vstats)
        if vstats.get("venue_batting"):
            ps.reasons.append(f"SR {vstats['venue_batting']['strike_rate']} at this venue")
        if vstats.get("venue_bowling"):
            ps.reasons.append(f"{vstats['venue_bowling']['wickets']} wkts at {vstats['venue_bowling']['economy']} econ here")

        ps.form_score = get_player_recent_form(db, player.name)

        is_batter = player.player_role in ["Batter", "Wicket Keeper Batter"]
        is_bowler = player.player_role == "Bowler"
        ms_b, r_b, w_b = calculate_matchup_score(player, opp_analysis, True)
        ms_bw, r_bw, w_bw = calculate_matchup_score(player, opp_analysis, False)

        if is_batter:
            ps.matchup_score = ms_b
            ps.reasons.extend(r_b[:2])
        elif is_bowler:
            ps.matchup_score = ms_bw
            ps.reasons.extend(r_bw[:2])
        else:
            ps.matchup_score = (ms_b + ms_bw) / 2
            ps.reasons.extend(r_b[:1] + r_bw[:1])

        ps.total_score = ps.venue_score * 0.35 + ps.form_score * 0.30 + ps.matchup_score * 0.35
        scored.append(ps)

    scored.sort(key=lambda x: x.total_score, reverse=True)

    # ── Build balanced SQUAD of 15 first ──────────────────────────
    squad = []
    role_counts_squad = {"Batter": 0, "Wicket Keeper Batter": 0, "All Rounder": 0, "Bowler": 0}
    role_limits_squad = {"Batter": 6, "Wicket Keeper Batter": 2, "All Rounder": 4, "Bowler": 5}

    for ps in scored:
        if len(squad) >= 17:
            break
        if role_counts_squad.get(ps.role, 0) < role_limits_squad.get(ps.role, 3):
            squad.append(ps)
            role_counts_squad[ps.role] = role_counts_squad.get(ps.role, 0) + 1

    for ps in scored:
        if len(squad) >= 17:
            break
        if ps not in squad:
            squad.append(ps)

    # ── Select best XI from squad ──────────────────────────────────
    selected = []
    role_counts = {"Batter": 0, "Wicket Keeper Batter": 0, "All Rounder": 0, "Bowler": 0}
    role_limits = {"Batter": 5, "Wicket Keeper Batter": 1, "All Rounder": 3, "Bowler": 4}

    for ps in squad:
        if len(selected) >= 11:
            break
        if role_counts.get(ps.role, 0) < role_limits.get(ps.role, 2):
            selected.append(ps)
            role_counts[ps.role] = role_counts.get(ps.role, 0) + 1

    for ps in squad:
        if len(selected) >= 11:
            break
        if ps not in selected:
            selected.append(ps)

    left_h = sum(1 for p in selected if p.batting_style == "Left Hand")
    right_h = sum(1 for p in selected if p.batting_style == "Right Hand")
    spinners = sum(1 for p in selected if p.bowling_style and any(s in str(p.bowling_style) for s in ["Orthodox", "Off Break", "Leg Break", "Wrist"]))
    pacers = sum(1 for p in selected if p.bowling_style and any(s in str(p.bowling_style) for s in ["Fast", "Medium"]))

    warnings = []
    if left_h < 2:
        warnings.append(f"⚠️ Only {left_h} left-hand batter(s) — consider adding more")
    if spinners == 0:
        warnings.append("⚠️ No spinners in XI")
    if pacers == 0:
        warnings.append("⚠️ No pace bowlers in XI")

    insights = []
    dominant = opp_analysis.get("dominant_bowling_threat", "Unknown")
    if "Spin" in dominant:
        insights.append("🎯 Opponent bowls mainly spin — aggressive footwork key")
    elif "Pace" in dominant:
        insights.append("🎯 Opponent relies on pace — technique against short ball important")
    if opp_analysis.get("right_hand_heavy_batting"):
        insights.append("🎯 Opponent bats right-hand heavy — left-arm bowlers have angle advantage")
    else:
        insights.append("🎯 Opponent has left-hand batters — right-arm angles important")

    cutoff = date.today() - timedelta(days=3 * 365)

    return {
        "venue": venue_name,
        "opponent": opponent_team,
        "active_player_pool_size": len(sl_players),
        "selection_criteria": {
            "layer_1": f"Played for SL since {cutoff.strftime('%d %b %Y')} (rolling 3 years)",
            "layer_2": "Appeared in at least 1 of last 10 SL matches",
            "note": "Retired player stats still used for venue and analytics calculations",
        },
        "squad_17": [
            {
                "rank": i + 1,
                "name": p.name,
                "role": p.role,
                "batting_style": p.batting_style,
                "bowling_style": p.bowling_style,
                "selection_score": round(p.total_score, 2),
                "in_recommended_xi": p in selected,
            }
            for i, p in enumerate(squad)
        ],
        "recommended_xi": [
            {
                "position": i + 1,
                "name": p.name,
                "role": p.role,
                "batting_style": p.batting_style,
                "bowling_style": p.bowling_style,
                "selection_score": round(p.total_score, 2),
                "reasons": p.reasons[:3] if p.reasons else ["Selected on overall performance"],
                "warnings": p.warnings[:2],
            }
            for i, p in enumerate(selected)
        ],
        "xi_balance": {
            "left_hand_batters": left_h,
            "right_hand_batters": right_h,
            "spinners": spinners,
            "pace_bowlers": pacers,
            "all_rounders": role_counts.get("All Rounder", 0),
        },
        "opponent_analysis": opp_analysis,
        "balance_warnings": warnings,
        "matchup_insights": insights,
        "top_matchup_picks": [
            {
                "name": p.name,
                "role": p.role,
                "matchup_score": round(p.matchup_score, 2),
                "key_reason": p.reasons[0] if p.reasons else "Strong performer",
            }
            for p in sorted(selected, key=lambda x: x.matchup_score, reverse=True)[:3]
        ],
    }
