from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Match, Venue
from models.schemas import MatchOut
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[MatchOut])
def list_matches(
    team: Optional[str] = Query(None),
    venue_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    q = db.query(Match)
    if team:
        q = q.filter((Match.team1 == team) | (Match.team2 == team))
    if venue_id:
        q = q.filter(Match.venue_id == venue_id)
    matches = q.order_by(Match.date.desc()).limit(limit).all()

    result = []
    for m in matches:
        venue_name = m.venue.name if m.venue else None
        result.append(MatchOut(
            id=m.id,
            cricsheet_id=m.cricsheet_id,
            date=m.date,
            venue_name=venue_name,
            team1=m.team1 or "",
            team2=m.team2 or "",
            toss_winner=m.toss_winner or "",
            toss_decision=m.toss_decision or "",
            winner=m.winner,
            win_by_runs=m.win_by_runs,
            win_by_wickets=m.win_by_wickets,
        ))
    return result
