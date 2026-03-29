"""routers/venues.py"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Venue
from models.schemas import VenueOut, VenueStats, PhaseStats
from services.analytics import get_venue_stats, get_venue_phase_stats
from typing import List

router = APIRouter()

@router.get("/", response_model=List[VenueOut])
def list_venues(db: Session = Depends(get_db)):
    return db.query(Venue).order_by(Venue.name).all()

@router.get("/{venue_id}/stats", response_model=VenueStats)
def venue_stats(venue_id: int, db: Session = Depends(get_db)):
    stats = get_venue_stats(db, venue_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Venue not found")
    return stats

@router.get("/{venue_id}/phase-stats", response_model=List[PhaseStats])
def venue_phase_stats(venue_id: int, db: Session = Depends(get_db)):
    return get_venue_phase_stats(db, venue_id)
