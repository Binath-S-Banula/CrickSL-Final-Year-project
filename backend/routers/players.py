from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Player
from models.schemas import PlayerOut, BattingStats, BowlingStats, PlayerAtVenue
from services.analytics import get_batting_stats, get_bowling_stats
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[PlayerOut])
def list_players(
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db)
):
    q = db.query(Player)
    if search:
        q = q.filter(Player.name.ilike(f"%{search}%"))
    return q.order_by(Player.name).limit(50).all()

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
