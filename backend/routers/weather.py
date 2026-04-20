"""routers/weather.py - Unified weather conditions endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from services.weather_analysis import calculate_weather_conditions
from typing import Optional
from datetime import date

router = APIRouter()


@router.get("/conditions")
async def get_weather_conditions(
    venue_name: str = Query(..., description="Exact venue name"),
    sl_batting_first: bool = Query(True, description="Is SL batting first?"),
    match_date: Optional[str] = Query(None, description="Match date YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Unified weather conditions analysis.
    Covers dew risk, rain probability, swing conditions
    and their combined impact on Sri Lanka.
    """
    month = None
    if match_date:
        try:
            month = int(match_date.split("-")[1])
        except Exception:
            pass
    else:
        month = date.today().month

    result = await calculate_weather_conditions(
        db=db,
        venue_name=venue_name,
        sl_batting_first=sl_batting_first,
        match_date=match_date,
        match_month=month,
    )

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


@router.get("/venues-summary")
def get_venues_weather_summary(db: Session = Depends(get_db)):
    """Dew influence summary for all Sri Lankan venues."""
    from models.db_models import Venue
    from services.weather_analysis import get_venue_historical_dew_pattern, risk_label

    sl_venues = db.query(Venue).filter(Venue.country == "Sri Lanka").all()
    results = []

    for venue in sl_venues:
        h = get_venue_historical_dew_pattern(db, venue.id)
        if h["total_matches"] < 3:
            continue
        score = h["dew_influence_factor"]
        results.append({
            "venue_id": venue.id,
            "venue_name": venue.name,
            "city": venue.city,
            "total_matches": h["total_matches"],
            "chase_win_pct": h["overall_chase_win_pct"],
            "dew_influence_factor": score,
            "dew_risk_label": risk_label(score),
            "toss_field_win_pct": h["toss_field_win_pct"],
        })

    results.sort(key=lambda x: x["dew_influence_factor"], reverse=True)
    return results
