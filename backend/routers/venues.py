from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Venue
from models.schemas import VenueOut, VenueStats, PhaseStats
from services.analytics import get_venue_stats, get_venue_phase_stats, get_venue_par_score
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[VenueOut])
def list_venues(sl_only: bool = False, db: Session = Depends(get_db)):
    SL_KEYWORDS = [
        'colombo', 'kandy', 'galle', 'hambantota', 'dambulla',
        'pallekele', 'premadasa', 'sara oval', 'sinhalese', 'rangiri',
        'mahinda', 'moratuwa', 'bloomfield', 'sri lanka', 'p sara'
    ]
    query = db.query(Venue)
    if sl_only:
        from sqlalchemy import or_
        filters = [Venue.name.ilike(f'%{kw}%') for kw in SL_KEYWORDS]
        query = query.filter(or_(*filters))
    return query.order_by(Venue.name).all()

@router.get("/{venue_id}/stats", response_model=VenueStats)
def venue_stats(venue_id: int, opponent_team: Optional[str] = Query(None), db: Session = Depends(get_db)):
    stats = get_venue_stats(db, venue_id, opponent_team)
    if not stats:
        raise HTTPException(status_code=404, detail="Venue not found")
    return stats

@router.get("/{venue_id}/par-score")
def venue_par_score(venue_id: int,
    sl_role: str = Query("batting", description="batting or bowling"),
    opponent_team: Optional[str] = Query(None),
    db: Session = Depends(get_db)):
    result = get_venue_par_score(db, venue_id, sl_role=sl_role, opponent_team=opponent_team)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/{venue_id}/phase-stats", response_model=List[PhaseStats])
def venue_phase_stats(venue_id: int, db: Session = Depends(get_db)):
    return get_venue_phase_stats(db, venue_id)
