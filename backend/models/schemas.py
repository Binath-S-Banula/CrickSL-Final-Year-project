from pydantic import BaseModel
from typing import Optional, List
from datetime import date


# ── Venue ──────────────────────────────────────────────────────────
class VenueBase(BaseModel):
    name: str
    city: Optional[str]
    country: Optional[str]

class VenueOut(VenueBase):
    id: int
    class Config:
        from_attributes = True

class VenueStats(BaseModel):
    venue_id: int
    venue_name: str
    total_matches: int
    avg_first_innings_score: float
    avg_second_innings_score: float
    bat_first_wins: int
    chase_wins: int
    bat_first_win_pct: float
    chase_win_pct: float
    toss_recommendation: str

class PhaseStats(BaseModel):
    phase: str
    avg_runs: float
    avg_wickets: float
    total_deliveries: int


# ── Player ──────────────────────────────────────────────────────────
class PlayerOut(BaseModel):
    id: int
    name: str
    cricsheet_id: Optional[str]
    class Config:
        from_attributes = True

class BattingStats(BaseModel):
    player_name: str
    innings: int
    total_runs: int
    average: float
    strike_rate: float
    boundary_pct: float
    dot_ball_pct: float
    highest_score: int
    fifties: int
    hundreds: int

class BowlingStats(BaseModel):
    player_name: str
    innings: int
    wickets: int
    economy: float
    bowling_strike_rate: Optional[float]
    dot_ball_pct: float
    average: Optional[float]

class PlayerAtVenue(BaseModel):
    player_name: str
    venue_name: str
    batting: Optional[BattingStats]
    bowling: Optional[BowlingStats]


# ── Match ────────────────────────────────────────────────────────────
class MatchOut(BaseModel):
    id: int
    cricsheet_id: str
    date: Optional[date]
    venue_name: Optional[str]
    team1: str
    team2: str
    toss_winner: str
    toss_decision: str
    winner: Optional[str]
    win_by_runs: Optional[int]
    win_by_wickets: Optional[int]
    class Config:
        from_attributes = True


# ── Pre-match Report ─────────────────────────────────────────────────
class TopBatter(BaseModel):
    name: str
    runs: int
    average: float
    strike_rate: float

class TopBowler(BaseModel):
    name: str
    wickets: int
    economy: float

class PreMatchReport(BaseModel):
    venue_name: str
    team1: str
    team2: str
    venue_stats: VenueStats
    phase_stats: List[PhaseStats]
    toss_recommendation: str
    team1_top_batters: List[TopBatter]
    team1_top_bowlers: List[TopBowler]
    team2_top_batters: List[TopBatter]
    team2_top_bowlers: List[TopBowler]


# ── Prediction ───────────────────────────────────────────────────────
class PredictionInput(BaseModel):
    venue_name: str
    toss_winner: str          # "Sri Lanka" or opponent
    toss_decision: str        # "bat" or "field"
    team1: str
    team2: str

class PredictionOut(BaseModel):
    sl_win_probability: float
    opponent_win_probability: float
    recommendation: str
    key_factors: List[str]
