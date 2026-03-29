from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    city = Column(String)
    country = Column(String)

    matches = relationship("Match", back_populates="venue")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    cricsheet_id = Column(String, unique=True, nullable=True)


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    cricsheet_id = Column(String, unique=True, nullable=False)
    date = Column(Date)
    venue_id = Column(Integer, ForeignKey("venues.id"))
    team1 = Column(String)
    team2 = Column(String)
    toss_winner = Column(String)
    toss_decision = Column(String)
    winner = Column(String, nullable=True)
    win_by_runs = Column(Integer, nullable=True)
    win_by_wickets = Column(Integer, nullable=True)
    no_result = Column(Boolean, default=False)
    season = Column(String)

    venue = relationship("Venue", back_populates="matches")
    innings = relationship("Innings", back_populates="match")


class Innings(Base):
    __tablename__ = "innings"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    innings_number = Column(Integer)
    batting_team = Column(String)
    bowling_team = Column(String)
    total_runs = Column(Integer, default=0)
    total_wickets = Column(Integer, default=0)
    total_overs = Column(Float, default=0.0)

    match = relationship("Match", back_populates="innings")
    deliveries = relationship("Delivery", back_populates="innings")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id"))
    match_id = Column(Integer, ForeignKey("matches.id"))
    over_number = Column(Integer)
    ball_number = Column(Integer)
    phase = Column(String)
    batter = Column(String)
    bowler = Column(String)
    non_striker = Column(String)
    runs_batter = Column(Integer, default=0)
    runs_extras = Column(Integer, default=0)
    runs_total = Column(Integer, default=0)
    is_wide = Column(Boolean, default=False)
    is_noball = Column(Boolean, default=False)
    is_bye = Column(Boolean, default=False)
    is_legbye = Column(Boolean, default=False)
    is_wicket = Column(Boolean, default=False)
    wicket_kind = Column(String, nullable=True)
    player_out = Column(String, nullable=True)
    is_boundary_four = Column(Boolean, default=False)
    is_boundary_six = Column(Boolean, default=False)

    innings = relationship("Innings", back_populates="deliveries")