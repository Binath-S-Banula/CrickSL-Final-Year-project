from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Existing Schemas ─────────────────────────────────────────────

class VenueBase(BaseModel):
    name: str
    city: Optional[str] = None
    country: Optional[str] = None

class VenueResponse(VenueBase):
    id: int
    class Config:
        from_attributes = True

class PlayerBase(BaseModel):
    name: str

class PlayerResponse(PlayerBase):
    id: int
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    player_role: Optional[str] = None
    nationality: Optional[str] = None
    class Config:
        from_attributes = True

class MatchBase(BaseModel):
    date: Optional[str] = None
    team1: str
    team2: str
    winner: Optional[str] = None

class MatchResponse(MatchBase):
    id: int
    toss_winner: Optional[str] = None
    toss_decision: Optional[str] = None
    class Config:
        from_attributes = True

class PredictionRequest(BaseModel):
    venue_name: str
    toss_winner: str
    toss_decision: str
    team1: str
    team2: str

class PredictionResponse(BaseModel):
    sl_win_probability: float
    opponent_win_probability: float
    recommendation: str
    key_factors: List[str]


# ─── NEW: Auth Schemas ────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str
