from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Player, Delivery, Match
from models.schemas import PlayerOut, BattingStats, BowlingStats, PlayerAtVenue
from services.analytics import get_batting_stats, get_bowling_stats
from typing import List, Optional

router = APIRouter()


@router.get("/", response_model=List[PlayerOut])
def list_players(
    search: Optional[str] = Query(None, description="Search by name"),
    country: Optional[str] = Query(None, description="Filter by country"),
    role: Optional[str] = Query(None, description="Filter by role"),
    db: Session = Depends(get_db)
):
    q = db.query(Player)
    if search:
        q = q.filter(Player.name.ilike(f"%{search}%"))
    if country:
        q = q.filter(Player.nationality == country)
    if role:
        q = q.filter(Player.player_role.ilike(f"%{role}%"))
    return q.order_by(Player.name).limit(50).all()


@router.get("/sri-lanka-squad", response_model=List[PlayerOut])
def get_sl_squad(db: Session = Depends(get_db)):
    """Returns all Sri Lanka players with their metadata."""
    return db.query(Player).filter(
        Player.nationality == "Sri Lanka"
    ).order_by(Player.player_role, Player.name).all()


@router.get("/matchup-analysis")
def get_matchup_analysis(
    bowler_style: str = Query(..., description="Bowling style e.g. Left Arm Orthodox"),
    batting_hand: str = Query(..., description="Batting hand: Right Hand or Left Hand"),
    db: Session = Depends(get_db)
):
    """
    Analyzes how batters of a specific hand perform
    against a specific bowling style.
    Returns average runs, strike rate, and dismissal rate.
    """
    # Get all players with matching bowling style
    bowlers = db.query(Player).filter(
        Player.bowling_style.ilike(f"%{bowler_style}%")
    ).all()
    bowler_names = [b.name for b in bowlers]

    if not bowler_names:
        raise HTTPException(
            status_code=404,
            detail=f"No bowlers found with style: {bowler_style}"
        )

    # Get all players with matching batting hand
    batters = db.query(Player).filter(
        Player.batting_style == batting_hand,
        Player.nationality == "Sri Lanka"
    ).all()
    batter_names = [b.name for b in batters]

    if not batter_names:
        return {
            "bowler_style": bowler_style,
            "batting_hand": batting_hand,
            "message": "No Sri Lanka batters found with this batting hand"
        }

    # Analyze deliveries
    deliveries = db.query(Delivery).filter(
        Delivery.batter.in_(batter_names),
        Delivery.bowler.in_(bowler_names),
        Delivery.is_wide == False,
    ).all()

    if not deliveries:
        return {
            "bowler_style": bowler_style,
            "batting_hand": batting_hand,
            "total_deliveries": 0,
            "message": "No delivery data found for this matchup"
        }

    total_runs = sum(d.runs_batter for d in deliveries)
    total_balls = len(deliveries)
    total_wickets = sum(1 for d in deliveries if d.is_wicket)
    boundaries = sum(1 for d in deliveries if d.is_boundary_four or d.is_boundary_six)
    dot_balls = sum(1 for d in deliveries if d.runs_batter == 0)

    strike_rate = round(total_runs / total_balls * 100, 2) if total_balls else 0
    dismissal_rate = round(total_wickets / total_balls * 100, 2) if total_balls else 0
    boundary_pct = round(boundaries / total_balls * 100, 1) if total_balls else 0
    dot_pct = round(dot_balls / total_balls * 100, 1) if total_balls else 0

    # Determine matchup advantage
    if strike_rate > 130:
        advantage = "BATTER DOMINANT — batters score freely vs this bowling style"
    elif strike_rate < 110:
        advantage = "BOWLER DOMINANT — this bowling style restricts these batters"
    else:
        advantage = "BALANCED — neither side has a clear advantage"

    return {
        "bowler_style": bowler_style,
        "batting_hand": batting_hand,
        "total_deliveries": total_balls,
        "total_runs": total_runs,
        "total_wickets": total_wickets,
        "strike_rate": strike_rate,
        "dismissal_rate_pct": dismissal_rate,
        "boundary_pct": boundary_pct,
        "dot_ball_pct": dot_pct,
        "matchup_advantage": advantage,
        "sl_batters_analyzed": len(set(d.batter for d in deliveries)),
        "bowlers_analyzed": len(set(d.bowler for d in deliveries)),
    }


@router.get("/{player_name}/batting", response_model=BattingStats)
def player_batting(
    player_name: str,
    venue_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    stats = get_batting_stats(db, player_name, venue_id)
    if not stats:
        raise HTTPException(status_code=404, detail="No batting data found")
    return stats


@router.get("/{player_name}/bowling", response_model=BowlingStats)
def player_bowling(
    player_name: str,
    venue_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    stats = get_bowling_stats(db, player_name, venue_id)
    if not stats:
        raise HTTPException(status_code=404, detail="No bowling data found")
    return stats


@router.get("/{player_name}/profile")
def player_full_profile(player_name: str, db: Session = Depends(get_db)):
    """Returns complete player profile including metadata + stats."""
    player = db.query(Player).filter(Player.name == player_name).first()

    batting = get_batting_stats(db, player_name)
    bowling = get_bowling_stats(db, player_name)

    return {
        "name": player_name,
        "nationality": player.nationality if player else None,
        "batting_style": player.batting_style if player else None,
        "bowling_style": player.bowling_style if player else None,
        "player_role": player.player_role if player else None,
        "batting_stats": batting,
        "bowling_stats": bowling,
    }


@router.get("/{player_name}/venue/{venue_id}", response_model=PlayerAtVenue)
def player_at_venue(player_name: str, venue_id: int, db: Session = Depends(get_db)):
    from models.db_models import Venue
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return PlayerAtVenue(
        player_name=player_name,
        venue_name=venue.name,
        batting=get_batting_stats(db, player_name, venue_id),
        bowling=get_bowling_stats(db, player_name, venue_id),
    )
