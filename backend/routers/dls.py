"""routers/dls.py - DLS rain interruption calculator endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.dls_calculator import calculate_dls
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class DLSInput(BaseModel):
    venue_name: str
    sl_role: str           # "batting_first" or "chasing"
    opponent_team: str
    playing_xi: List[str]  # 11 player names
    overs_available: Optional[int] = 20

    class Config:
        json_schema_extra = {
            "example": {
                "venue_name": "R Premadasa Stadium",
                "sl_role": "batting_first",
                "opponent_team": "India",
                "playing_xi": [
                    "P Nissanka", "K Mishara", "BKG Mendis",
                    "KIC Asalanka", "MD Shanaka", "DM de Silva",
                    "DN Wellalage", "PHKD Mendis", "M Theekshana",
                    "M Pathirana", "A Dananjaya"
                ],
                "overs_available": 20
            }
        }


@router.post("/calculate")
def calculate_dls_prediction(
    input: DLSInput,
    db: Session = Depends(get_db),
):
    """
    Pre-match DLS rain interruption prediction.
    Uses venue par score and generates 5-over milestone table.
    """
    if len(input.playing_xi) not in [11, 15]:
        raise HTTPException(
            status_code=400,
            detail=f"Playing XI must have 11 or 15 players. Got {len(input.playing_xi)}"
        )

    if input.sl_role not in ["batting_first", "chasing"]:
        raise HTTPException(
            status_code=400,
            detail="sl_role must be 'batting_first' or 'chasing'"
        )

    result = calculate_dls(
        db=db,
        venue_name=input.venue_name,
        sl_role=input.sl_role,
        opponent_team=input.opponent_team,
        playing_xi=input.playing_xi,
        overs_available=input.overs_available,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.get("/par-score")
def get_par_score(
    venue_name: str,
    sl_role: str = "batting_first",
    opponent_team: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get opponent-adjusted par score for a venue."""
    from models.db_models import Venue
    from services.analytics import get_venue_par_score

    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    if not venue:
        raise HTTPException(status_code=404, detail=f"Venue '{venue_name}' not found")

    role = "batting" if sl_role == "batting_first" else "bowling"
    result = get_venue_par_score(db, venue.id, sl_role=role, opponent_team=opponent_team)
    return result
