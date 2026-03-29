from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.schemas import PredictionInput, PredictionOut
from services.ml_model import predict_win_probability

router = APIRouter()

@router.post("/", response_model=PredictionOut)
def predict(input: PredictionInput, db: Session = Depends(get_db)):
    result = predict_win_probability(db, input)
    if not result:
        raise HTTPException(status_code=400, detail="Not enough data for this match configuration")
    return result
