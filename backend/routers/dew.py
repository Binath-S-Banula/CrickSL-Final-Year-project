"""
routers/dew.py
──────────────
API endpoints for dew risk analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from services.dew_analysis import calculate_dew_risk
from typing import Optional
from datetime import date

router = APIRouter()


@router.get("/risk")
async def get_dew_risk(
    venue_name: str = Query(..., description="Exact venue name"),
    match_date: Optional[str] = Query(None, description="Match date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    Calculate dew risk for a venue on a specific date.
    Combines historical venue patterns with live weather forecast.
    """
    # Default to today's month if no date provided
    month = None
    if match_date:
        try:
            month = int(match_date.split("-")[1])
        except Exception:
            pass
    else:
        month = date.today().month

    result = await calculate_dew_risk(
        db=db,
        venue_name=venue_name,
        match_date=match_date,
        match_month=month,
    )

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


@router.get("/venues-summary")
def get_all_venues_dew_summary(db: Session = Depends(get_db)):
    """
    Returns dew influence summary for all Sri Lankan venues.
    Based on historical chase win rates.
    """
    from models.db_models import Venue
    from services.dew_analysis import get_venue_historical_dew_pattern, get_dew_risk_label

    sl_venues = db.query(Venue).filter(
        Venue.country == "Sri Lanka"
    ).all()

    results = []
    for venue in sl_venues:
        historical = get_venue_historical_dew_pattern(db, venue.id)
        if historical["total_matches"] < 3:
            continue

        score = historical["dew_influence_factor"]
        results.append({
            "venue_id": venue.id,
            "venue_name": venue.name,
            "city": venue.city,
            "total_matches": historical["total_matches"],
            "chase_win_pct": historical["overall_chase_win_pct"],
            "dew_influence_factor": score,
            "dew_risk_label": get_dew_risk_label(score),
            "toss_field_win_pct": historical["toss_field_win_pct"],
        })

    results.sort(key=lambda x: x["dew_influence_factor"], reverse=True)
    return results
