"""
routers/xi_recommendation.py
─────────────────────────────
API endpoints for Playing XI recommendation.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.xi_recommender import recommend_xi, analyze_opponent_xi
from pydantic import BaseModel
from typing import List

router = APIRouter()


class XIRecommendationInput(BaseModel):
    venue_name: str
    opponent_team: str
    opponent_xi: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "venue_name": "R Premadasa Stadium",
                "opponent_team": "India",
                "opponent_xi": [
                    "Rohit Sharma",
                    "Virat Kohli",
                    "Shubman Gill",
                    "Suryakumar Yadav",
                    "Hardik Pandya",
                    "Rishabh Pant",
                    "Ravindra Jadeja",
                    "Axar Patel",
                    "Jasprit Bumrah",
                    "Mohammed Shami",
                    "Kuldeep Yadav",
                ]
            }
        }


@router.post("/recommend")
def get_xi_recommendation(
    input: XIRecommendationInput,
    db: Session = Depends(get_db)
):
    """
    Recommends the optimal Sri Lanka Playing XI for an upcoming match.
    Considers venue performance, recent form, and opponent matchups.
    """
    if len(input.opponent_xi) != 11:
        raise HTTPException(
            status_code=400,
            detail=f"Opponent XI must have exactly 11 players. Got {len(input.opponent_xi)}."
        )

    result = recommend_xi(
        db=db,
        venue_name=input.venue_name,
        opponent_team=input.opponent_team,
        opponent_xi=input.opponent_xi,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/analyze-opponent")
def analyze_opponent(
    opponent_xi: List[str],
    db: Session = Depends(get_db)
):
    """
    Analyzes an opponent XI composition.
    Returns breakdown of their batting types and bowling styles.
    """
    if not opponent_xi:
        raise HTTPException(status_code=400, detail="Opponent XI cannot be empty")

    analysis = analyze_opponent_xi(db, opponent_xi)
    return {
        "opponent_xi_provided": opponent_xi,
        "analysis": analysis,
        "summary": f"Opponent has {analysis['batter_types'].get('Right Hand', 0)} right-hand "
                   f"and {analysis['batter_types'].get('Left Hand', 0)} left-hand batters. "
                   f"Dominant bowling threat: {analysis['dominant_bowling_threat']}."
    }
