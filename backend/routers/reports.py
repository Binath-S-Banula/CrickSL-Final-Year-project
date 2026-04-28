from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Venue
from models.schemas import PreMatchReport
from services.analytics import (
    get_venue_stats,
    get_venue_phase_stats,
    get_top_batters_at_venue,
    get_top_bowlers_at_venue,
)

router = APIRouter()


@router.get("/prematch", response_model=PreMatchReport)
def prematch_report(
    venue_name: str = Query(..., description="Exact venue name"),
    team1: str = Query(..., description="First team (usually Sri Lanka)"),
    team2: str = Query(..., description="Opponent team"),
    db: Session = Depends(get_db),
):
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    if not venue:
        raise HTTPException(status_code=404, detail=f"Venue '{venue_name}' not found")

    venue_stats = get_venue_stats(db, venue.id)
    phase_stats = get_venue_phase_stats(db, venue.id)

    team1_batters, t1b_years = get_top_batters_at_venue(db, team1, venue.id)
    team1_bowlers, t1bw_years = get_top_bowlers_at_venue(db, team1, venue.id)
    team2_batters, _ = get_top_batters_at_venue(db, team2, venue.id)
    team2_bowlers, _ = get_top_bowlers_at_venue(db, team2, venue.id)

    # Use the wider window if fallback was triggered
    player_data_years = max(t1b_years, t1bw_years)

    return PreMatchReport(
        venue_name=venue.name,
        team1=team1,
        team2=team2,
        venue_stats=venue_stats,
        phase_stats=phase_stats,
        toss_recommendation=venue_stats.toss_recommendation if venue_stats else None,
        team1_top_batters=team1_batters,
        team1_top_bowlers=team1_bowlers,
        team2_top_batters=team2_batters,
        team2_top_bowlers=team2_bowlers,
        player_data_years=player_data_years,
    )
