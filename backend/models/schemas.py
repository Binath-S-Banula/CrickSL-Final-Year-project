from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime, date


# ─── Venue Schemas ────────────────────────────────────────────────

class VenueBase(BaseModel):
    name: str
    city: Optional[str] = None
    country: Optional[str] = None

class VenueOut(VenueBase):
    id: int
    class Config:
        from_attributes = True

VenueResponse = VenueOut

class PhaseStats(BaseModel):
    phase: str
    avg_runs: float
    avg_wickets: float
    run_rate: float

class VenueStats(BaseModel):
    venue_id: int
    venue_name: str
    total_matches: int
    avg_first_innings: float
    avg_second_innings: float
    bat_first_wins: int
    chase_wins: int
    bat_first_win_pct: float
    chase_win_pct: float
    toss_recommendation: str
    phase_stats: Optional[List[PhaseStats]] = []

class ParScoreResponse(BaseModel):
    venue_id: int
    venue_name: str
    sl_role: str
    opponent_team: Optional[str] = None
    overall_venue_avg: float
    sl_at_venue: Optional[float] = None
    sl_vs_opponent: Optional[float] = None
    recommended: float
    data_level: str
    confidence: str
    matches_used: int


# ─── Player Schemas ───────────────────────────────────────────────

class PlayerBase(BaseModel):
    name: str

class PlayerOut(PlayerBase):
    id: int
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    player_role: Optional[str] = None
    nationality: Optional[str] = None
    class Config:
        from_attributes = True

PlayerResponse = PlayerOut

class BattingStats(BaseModel):
    player_name: str
    matches: int
    innings: int
    runs: int
    average: float
    strike_rate: float
    fifties: int
    hundreds: int
    boundary_pct: float
    dot_ball_pct: float

class BowlingStats(BaseModel):
    player_name: str
    matches: int
    wickets: int
    economy: float
    average: float
    strike_rate: float
    dot_ball_pct: float

class PlayerAtVenue(BaseModel):
    player_name: str
    matches: int
    runs: Optional[int] = None
    average: Optional[float] = None
    strike_rate: Optional[float] = None
    wickets: Optional[int] = None
    economy: Optional[float] = None
    role: Optional[str] = None


# ─── Match Schemas ────────────────────────────────────────────────

class MatchBase(BaseModel):
    date: Optional[str] = None
    team1: str
    team2: str
    winner: Optional[str] = None

class MatchOut(MatchBase):
    id: int
    toss_winner: Optional[str] = None
    toss_decision: Optional[str] = None
    venue_id: Optional[int] = None
    class Config:
        from_attributes = True

MatchResponse = MatchOut


# ─── Prediction Schemas ───────────────────────────────────────────

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

# Aliases used by predictions router
class PredictionInput(BaseModel):
    venue_name: str
    toss_winner: str
    toss_decision: str
    team1: str
    team2: str

class PredictionOut(BaseModel):
    sl_win_probability: float
    opponent_win_probability: float
    recommendation: str
    key_factors: List[str]


# ─── XI Recommendation Schemas ────────────────────────────────────

class XIRecommendationRequest(BaseModel):
    venue_name: str
    opponent_team: str
    opponent_xi: List[str]

class PlayerXIEntry(BaseModel):
    position: int
    name: str
    role: Optional[str] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    score: Optional[float] = None
    reason: Optional[str] = None
    in_recommended_xi: Optional[bool] = None

class XIRecommendationResponse(BaseModel):
    venue_name: str
    opponent_team: str
    recommended_xi: List[PlayerXIEntry]
    squad_17: Optional[List[PlayerXIEntry]] = []
    matchup_insights: Optional[Dict[str, Any]] = {}
    selection_criteria: Optional[Dict[str, str]] = {}
    active_player_pool_size: Optional[int] = None


# ─── DLS Schemas ──────────────────────────────────────────────────

class DLSRequest(BaseModel):
    venue_name: str
    sl_role: str
    opponent_team: str
    playing_xi: List[str]
    overs_available: int = 20

class DLSResponse(BaseModel):
    venue_name: str
    sl_role: str
    par_score: float
    total_overs: int
    required_run_rate: float
    milestone_table: List[Any]
    match_strategy: List[str]
    playing_xi: List[Any]
    data_source: Optional[str] = None


# ─── Weather Schemas ──────────────────────────────────────────────

class WeatherResponse(BaseModel):
    venue_name: str
    match_date: Optional[str] = None
    dew_risk_score: float
    dew_risk_label: str
    humidity_pct: Optional[float] = None
    rain_probability: Optional[float] = None
    cloud_cover: Optional[float] = None
    humidity_source: Optional[str] = None
    weather_data: Optional[Dict[str, Any]] = {}
    impacts: List[str] = []
    recommendations: List[str] = []
    sl_impact_analysis: Optional[Dict[str, Any]] = {}
    toss_recommendation: Optional[str] = None


# ─── Analytics Extra Schemas ──────────────────────────────────────

class TopBatter(BaseModel):
    name: str
    matches: int
    runs: int
    average: float
    strike_rate: float

class TopBowler(BaseModel):
    name: str
    matches: int
    wickets: int
    economy: float
    average: float


# ─── Reports Schemas ──────────────────────────────────────────────

class PreMatchReport(BaseModel):
    venue_name: str
    team1: str
    team2: str
    venue_stats: Optional[VenueStats] = None
    phase_stats: Optional[List[PhaseStats]] = []
    toss_recommendation: Optional[str] = None
    team1_top_batters: Optional[List[TopBatter]] = []
    team1_top_bowlers: Optional[List[TopBowler]] = []
    team2_top_batters: Optional[List[TopBatter]] = []
    team2_top_bowlers: Optional[List[TopBowler]] = []


# ─── Auth Schemas ─────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "analyst"

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
