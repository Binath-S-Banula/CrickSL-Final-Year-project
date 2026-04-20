"""
xi_recommender.py
─────────────────
Playing XI recommendation engine for CrickSL.

Logic:
  1. Analyze opponent XI — identify their bowler types and batter types
  2. Score each SL player based on:
     - Performance at the venue
     - Performance vs opponent historically
     - Recent form
     - Matchup advantage vs opponent's bowling/batting types
     - Phase performance (PP/Middle/Death)
  3. Select balanced XI:
     - 5-6 specialist batters
     - 1 wicket keeper
     - 2-3 all rounders
     - 3-4 specialist bowlers
     - Left/Right hand batting balance
     - Spin/Pace bowling balance
  4. Generate reasons for each selection
"""

from sqlalchemy.orm import Session
from models.db_models import Player, Delivery, Match, Venue
from typing import List, Optional, Dict
from dataclasses import dataclass, field


@dataclass
class PlayerScore:
    """Scoring container for XI selection algorithm."""
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
    """Score a player based on their performance at a venue. Returns (score, stats_dict)."""
    deliveries = db.query(Delivery).filter(
        Delivery.match_id.in_(
            db.query(Match.id).filter(Match.venue_id == venue_id)
        ),
        Delivery.is_wide == False,
    )

    # Batting performance
    bat_deliveries = deliveries.filter(Delivery.batter == player_name).all()
    bowl_deliveries = deliveries.filter(Delivery.bowler == player_name).all()

    batting_score = 0.0
    bowling_score = 0.0
    stats = {}

    if bat_deliveries and len(bat_deliveries) >= 10:
        runs = sum(d.runs_batter for d in bat_deliveries)
        balls = len(bat_deliveries)
        sr = runs / balls * 100 if balls else 0
        boundaries = sum(1 for d in bat_deliveries if d.is_boundary_four or d.is_boundary_six)
        dismissals = len(db.query(Delivery).filter(
            Delivery.player_out == player_name,
            Delivery.match_id.in_(
                db.query(Match.id).filter(Match.venue_id == venue_id)
            )
        ).all())
        avg = runs / dismissals if dismissals else runs

        batting_score = min(10, (sr / 130 * 5) + (avg / 30 * 5))
        stats["venue_batting"] = {
            "runs": runs, "balls": balls,
            "strike_rate": round(sr, 1), "average": round(avg, 1)
        }

    if bowl_deliveries and len(bowl_deliveries) >= 12:
        legal = [d for d in bowl_deliveries if not d.is_wide and not d.is_noball]
        runs_conceded = sum(d.runs_total for d in bowl_deliveries if not d.is_bye and not d.is_legbye)
        wickets = sum(1 for d in bowl_deliveries if d.is_wicket and d.wicket_kind not in ["run out"])
        overs = len(legal) / 6
        economy = runs_conceded / overs if overs else 0

        bowling_score = min(10, (max(0, 10 - economy) / 10 * 5) + (wickets / max(1, overs) * 2))
        stats["venue_bowling"] = {
            "wickets": wickets,
            "economy": round(economy, 2),
            "overs": round(overs, 1)
        }

    return max(batting_score, bowling_score), stats


def get_player_recent_form(db: Session, player_name: str, n_matches: int = 5) -> float:
    """Score player based on recent performances. Returns 0-10 score."""
    recent_batting = db.query(Delivery).filter(
        Delivery.batter == player_name,
        Delivery.is_wide == False,
    ).order_by(Delivery.match_id.desc()).limit(n_matches * 30).all()

    if not recent_batting:
        return 5.0  # Neutral if no data

    runs = sum(d.runs_batter for d in recent_batting)
    balls = len(recent_batting)
    sr = runs / balls * 100 if balls else 0

    return min(10, sr / 130 * 10)


def analyze_opponent_xi(db: Session, opponent_players: List[str]) -> Dict:
    """
    Analyze opponent XI composition.
    Returns breakdown of their bowling styles and batting types.
    """
    bowler_types = {}
    batter_types = {"Right Hand": 0, "Left Hand": 0}
    roles = {"Batter": 0, "Bowler": 0, "All Rounder": 0, "Wicket Keeper Batter": 0}

    for name in opponent_players:
        player = db.query(Player).filter(Player.name == name).first()
        if not player:
            # Try partial match
            parts = name.split()
            if parts:
                player = db.query(Player).filter(
                    Player.name.ilike(f"%{parts[-1]}%")
                ).first()

        if player:
            # Batting hand
            if player.batting_style:
                hand = player.batting_style
                batter_types[hand] = batter_types.get(hand, 0) + 1

            # Bowling style
            if player.bowling_style and player.bowling_style != "None":
                style = player.bowling_style
                # Group into categories
                if "Fast" in style or "Medium" in style:
                    category = "Pace"
                elif "Orthodox" in style or "Off Break" in style:
                    category = "Spin (Off/Orthodox)"
                elif "Leg Break" in style or "Wrist" in style:
                    category = "Spin (Leg/Wrist)"
                else:
                    category = "Other"
                bowler_types[category] = bowler_types.get(category, 0) + 1

            # Role
            if player.player_role:
                role = player.player_role
                if role in roles:
                    roles[role] = roles.get(role, 0) + 1

    # Determine dominant bowling threat
    dominant_bowling = max(bowler_types, key=bowler_types.get) if bowler_types else "Unknown"
    right_heavy = batter_types.get("Right Hand", 0) > batter_types.get("Left Hand", 0)

    return {
        "bowler_types": bowler_types,
        "batter_types": batter_types,
        "roles": roles,
        "dominant_bowling_threat": dominant_bowling,
        "right_hand_heavy_batting": right_heavy,
        "total_analyzed": len([p for p in opponent_players]),
    }


def calculate_matchup_score(
    player: Player,
    opponent_analysis: Dict,
    is_batter: bool
) -> tuple:
    """
    Calculate how well a player matches up against the opponent.
    Returns (score, reasons, warnings)
    """
    score = 5.0
    reasons = []
    warnings = []

    dominant_bowling = opponent_analysis.get("dominant_bowling_threat", "Unknown")
    right_heavy_opponent = opponent_analysis.get("right_hand_heavy_batting", True)

    if is_batter and player.batting_style:
        # Left-hand batters are valuable against right-heavy lineups (field disruption)
        if player.batting_style == "Left Hand":
            score += 1.5
            reasons.append("Left-hand batter disrupts field placement against right-arm bowlers")

        # Check batter vs dominant bowling type
        if "Pace" in dominant_bowling:
            if player.batting_style == "Right Hand":
                score += 0.5
            reasons.append(f"Opponent relies on pace bowling — technique against pace is key")
        elif "Spin" in dominant_bowling:
            score += 1.0
            reasons.append(f"Opponent uses spin heavily — good opportunity for aggressive batters")

    if not is_batter and player.bowling_style:
        bowler_types = opponent_analysis.get("bowler_types", {})

        # Left arm bowlers vs right-heavy batting lineup
        if player.bowling_style and "Left" in player.bowling_style:
            if right_heavy_opponent:
                score += 2.0
                reasons.append("Left-arm bowler creates awkward angle for right-hand heavy batting lineup")
            else:
                score += 0.5

        # Spin bowlers
        if "Orthodox" in str(player.bowling_style) or "Off Break" in str(player.bowling_style) or "Leg Break" in str(player.bowling_style):
            if right_heavy_opponent:
                score += 1.5
                reasons.append("Spin bowler effective against right-hand dominant batting lineup")

        # Pace bowlers
        if "Fast" in str(player.bowling_style) or "Medium" in str(player.bowling_style):
            score += 1.0
            reasons.append("Pace bowler adds variety to bowling attack")

    return score, reasons, warnings


def recommend_xi(
    db: Session,
    venue_name: str,
    opponent_team: str,
    opponent_xi: List[str],
) -> Dict:
    """
    Main XI recommendation function.
    Returns recommended SL XI with scores and reasons.
    """
    # Get venue
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    venue_id = venue.id if venue else None

    # Get all SL players with metadata
    sl_players = db.query(Player).filter(
        Player.nationality == "Sri Lanka"
    ).all()

    if not sl_players:
        return {"error": "No Sri Lanka player metadata found. Run load_player_metadata.py first."}

    # Analyze opponent
    opponent_analysis = analyze_opponent_xi(db, opponent_xi)

    # Score each SL player
    scored_players = []

    for player in sl_players:
        ps = PlayerScore(
            name=player.name,
            role=player.player_role or "Unknown",
            batting_style=player.batting_style or "Right Hand",
            bowling_style=player.bowling_style,
            nationality="Sri Lanka",
        )

        # 1. Venue score (weight: 35%)
        venue_score, venue_stats = get_player_venue_score(db, player.name, venue_id) if venue_id else (5.0, {})
        ps.venue_score = venue_score
        ps.stats.update(venue_stats)

        if venue_stats.get("venue_batting"):
            vb = venue_stats["venue_batting"]
            ps.reasons.append(f"SR {vb['strike_rate']} at this venue")

        if venue_stats.get("venue_bowling"):
            vbl = venue_stats["venue_bowling"]
            ps.reasons.append(f"{vbl['wickets']} wickets at {vbl['economy']} economy here")

        # 2. Form score (weight: 30%)
        form_score = get_player_recent_form(db, player.name)
        ps.form_score = form_score

        # 3. Matchup score (weight: 35%)
        is_batter = player.player_role in ["Batter", "Wicket Keeper Batter"]
        is_bowler = player.player_role in ["Bowler"]
        is_allrounder = player.player_role == "All Rounder"

        matchup_score_bat, bat_reasons, bat_warnings = calculate_matchup_score(
            player, opponent_analysis, is_batter=True
        )
        matchup_score_bowl, bowl_reasons, bowl_warnings = calculate_matchup_score(
            player, opponent_analysis, is_batter=False
        )

        if is_batter:
            ps.matchup_score = matchup_score_bat
            ps.reasons.extend(bat_reasons[:2])
        elif is_bowler:
            ps.matchup_score = matchup_score_bowl
            ps.reasons.extend(bowl_reasons[:2])
        else:
            ps.matchup_score = (matchup_score_bat + matchup_score_bowl) / 2
            ps.reasons.extend(bat_reasons[:1])
            ps.reasons.extend(bowl_reasons[:1])

        ps.warnings.extend(bat_warnings + bowl_warnings)

        # Calculate total weighted score
        ps.total_score = (
            ps.venue_score * 0.35 +
            ps.form_score * 0.30 +
            ps.matchup_score * 0.35
        )

        scored_players.append(ps)

    # Sort by score
    scored_players.sort(key=lambda x: x.total_score, reverse=True)

    # Select balanced XI
    selected = []
    role_counts = {
        "Batter": 0,
        "Wicket Keeper Batter": 0,
        "All Rounder": 0,
        "Bowler": 0,
    }
    role_limits = {
        "Batter": 5,
        "Wicket Keeper Batter": 1,
        "All Rounder": 3,
        "Bowler": 4,
    }

    # First pass — select by role limits
    for ps in scored_players:
        if len(selected) >= 11:
            break
        role = ps.role
        limit = role_limits.get(role, 2)
        if role_counts.get(role, 0) < limit:
            selected.append(ps)
            role_counts[role] = role_counts.get(role, 0) + 1

    # If less than 11, fill remaining spots with best available
    if len(selected) < 11:
        for ps in scored_players:
            if len(selected) >= 11:
                break
            if ps not in selected:
                selected.append(ps)

    # Analyze selected XI balance
    left_handers = sum(1 for p in selected if p.batting_style == "Left Hand")
    right_handers = sum(1 for p in selected if p.batting_style == "Right Hand")
    spinners = sum(1 for p in selected if p.bowling_style and
                   ("Orthodox" in p.bowling_style or "Off Break" in p.bowling_style or
                    "Leg Break" in p.bowling_style or "Wrist" in p.bowling_style))
    pacers = sum(1 for p in selected if p.bowling_style and
                 ("Fast" in p.bowling_style or "Medium" in p.bowling_style))

    # Generate balance warnings
    balance_warnings = []
    if left_handers < 2:
        balance_warnings.append("⚠️ Only " + str(left_handers) + " left-hand batter(s) — consider adding more for field disruption")
    if spinners == 0:
        balance_warnings.append("⚠️ No spinners in XI — bowling attack lacks variety")
    if pacers == 0:
        balance_warnings.append("⚠️ No pace bowlers in XI — unable to generate early movement")
    if role_counts.get("Wicket Keeper Batter", 0) == 0:
        balance_warnings.append("⚠️ No wicket keeper selected — review selection")

    # Key matchup insights
    matchup_insights = []
    dominant = opponent_analysis.get("dominant_bowling_threat", "Unknown")
    if "Spin" in dominant:
        matchup_insights.append(f"🎯 Opponent bowls mainly spin — aggressive footwork and hitting against spin will be key")
    elif "Pace" in dominant:
        matchup_insights.append(f"🎯 Opponent relies on pace — technique against short ball and swing important")

    if opponent_analysis.get("right_hand_heavy_batting"):
        matchup_insights.append("🎯 Opponent bats right-hand heavy — your left-arm bowlers and spinners have angle advantage")
    else:
        matchup_insights.append("🎯 Opponent has left-hand batters — right-arm off-spin and angles become important")

    return {
        "venue": venue_name,
        "opponent": opponent_team,
        "recommended_xi": [
            {
                "position": i + 1,
                "name": p.name,
                "role": p.role,
                "batting_style": p.batting_style,
                "bowling_style": p.bowling_style,
                "selection_score": round(p.total_score, 2),
                "reasons": p.reasons[:3] if p.reasons else ["Selected based on overall performance"],
                "warnings": p.warnings[:2],
            }
            for i, p in enumerate(selected)
        ],
        "xi_balance": {
            "left_hand_batters": left_handers,
            "right_hand_batters": right_handers,
            "spinners": spinners,
            "pace_bowlers": pacers,
            "all_rounders": role_counts.get("All Rounder", 0),
        },
        "opponent_analysis": opponent_analysis,
        "balance_warnings": balance_warnings,
        "matchup_insights": matchup_insights,
        "top_matchup_picks": [
            {
                "name": p.name,
                "role": p.role,
                "matchup_score": round(p.matchup_score, 2),
                "key_reason": p.reasons[0] if p.reasons else "Strong overall performer",
            }
            for p in sorted(selected, key=lambda x: x.matchup_score, reverse=True)[:3]
        ],
    }
