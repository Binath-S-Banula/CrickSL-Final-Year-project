"""
ml_model.py
───────────
Trains a logistic regression model to predict Sri Lanka win probability.
The model is trained on-demand the first time predict_win_probability()
is called, then cached in memory.

Features used:
  - venue_bat_first_win_pct   (historical win rate batting first at venue)
  - venue_chase_win_pct       (historical win rate chasing at venue)
  - sl_toss_win               (did Sri Lanka win toss? 1/0)
  - sl_batting_first          (is Sri Lanka batting first? 1/0)
  - sl_recent_form            (win rate in last 10 SL matches)
  - opponent_recent_form      (win rate in last 10 opponent matches)
"""

import os
import joblib
import numpy as np
from pathlib import Path
from sqlalchemy.orm import Session
from models.db_models import Match, Venue
from models.schemas import PredictionInput, PredictionOut
from typing import Optional

MODEL_PATH = Path(__file__).parent.parent / "ml" / "win_model.pkl"
_cached_model = None   # in-memory cache after first load


def _get_recent_form(db: Session, team: str, before_date=None, n: int = 10) -> float:
    """Win rate of a team in their last n completed matches."""
    q = db.query(Match).filter(
        (Match.team1 == team) | (Match.team2 == team),
        Match.winner != None,
        Match.no_result == False,
    ).order_by(Match.date.desc())

    if before_date:
        q = q.filter(Match.date < before_date)

    recent = q.limit(n).all()
    if not recent:
        return 0.5  # neutral if no data

    wins = sum(1 for m in recent if m.winner == team)
    return round(wins / len(recent), 3)


def _build_features(db: Session, match: Match, for_team: str = "Sri Lanka"):
    """Build feature vector for a single match."""
    venue_id = match.venue_id

    # Venue stats
    venue_matches = db.query(Match).filter(
        Match.venue_id == venue_id,
        Match.winner != None,
        Match.no_result == False,
    ).all()

    bat_first_wins = 0
    total_decided = 0
    for m in venue_matches:
        first_batting = m.toss_winner if m.toss_decision == "bat" else (
            m.team2 if m.toss_winner == m.team1 else m.team1
        )
        if m.winner:
            total_decided += 1
            if m.winner == first_batting:
                bat_first_wins += 1

    venue_bat_first_pct = bat_first_wins / total_decided if total_decided else 0.5
    venue_chase_pct = 1 - venue_bat_first_pct

    # Did for_team win toss?
    sl_toss_win = 1 if match.toss_winner == for_team else 0

    # Is for_team batting first?
    first_batting = match.toss_winner if match.toss_decision == "bat" else (
        match.team2 if match.toss_winner == match.team1 else match.team1
    )
    sl_batting_first = 1 if first_batting == for_team else 0

    opponent = match.team2 if match.team1 == for_team else match.team1

    sl_form = _get_recent_form(db, for_team, before_date=match.date)
    opp_form = _get_recent_form(db, opponent, before_date=match.date)

    return [
        venue_bat_first_pct,
        venue_chase_pct,
        sl_toss_win,
        sl_batting_first,
        sl_form,
        opp_form,
    ]


def train_model(db: Session):
    """Train model on all historical SL matches and save to disk."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import pickle

    print("🤖 Training win probability model...")

    sl_matches = db.query(Match).filter(
        (Match.team1 == "Sri Lanka") | (Match.team2 == "Sri Lanka"),
        Match.winner != None,
        Match.no_result == False,
        Match.venue_id != None,
    ).all()

    print(f"   Found {len(sl_matches)} Sri Lanka matches with results")

    if len(sl_matches) < 30:
        print("   ⚠️ Not enough matches to train. Need 30+.")
        return None

    X, y = [], []
    for m in sl_matches:
        try:
            features = _build_features(db, m, for_team="Sri Lanka")
            label = 1 if m.winner == "Sri Lanka" else 0
            X.append(features)
            y.append(label)
        except Exception as e:
            continue

    X = np.array(X)
    y = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # Try both models, keep best
    lr = LogisticRegression(max_iter=1000)
    rf = RandomForestClassifier(n_estimators=100, random_state=42)

    lr.fit(X_train_s, y_train)
    rf.fit(X_train_s, y_train)

    lr_acc = lr.score(X_test_s, y_test)
    rf_acc = rf.score(X_test_s, y_test)

    print(f"   Logistic Regression accuracy: {lr_acc:.3f}")
    print(f"   Random Forest accuracy:       {rf_acc:.3f}")

    best_model = rf if rf_acc >= lr_acc else lr
    best_name = "Random Forest" if rf_acc >= lr_acc else "Logistic Regression"
    print(f"   Using: {best_name}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": best_model, "scaler": scaler}, MODEL_PATH)
    print(f"   Model saved to {MODEL_PATH}")

    return {"model": best_model, "scaler": scaler}


def _load_or_train(db: Session):
    global _cached_model
    if _cached_model:
        return _cached_model

    if MODEL_PATH.exists():
        _cached_model = joblib.load(MODEL_PATH)
        print("✅ ML model loaded from disk.")
        return _cached_model

    # Train fresh
    _cached_model = train_model(db)
    return _cached_model


def predict_win_probability(db: Session, input: PredictionInput) -> Optional[PredictionOut]:
    """Predict Sri Lanka's win probability for an upcoming match."""
    bundle = _load_or_train(db)
    if not bundle:
        return None

    model = bundle["model"]
    scaler = bundle["scaler"]

    # Get venue
    venue = db.query(Venue).filter(Venue.name == input.venue_name).first()
    if not venue:
        return None

    # Build feature vector manually from input (no real match object)
    venue_matches = db.query(Match).filter(
        Match.venue_id == venue.id,
        Match.winner != None,
        Match.no_result == False,
    ).all()

    bat_first_wins = 0
    total_decided = 0
    for m in venue_matches:
        first_batting = m.toss_winner if m.toss_decision == "bat" else (
            m.team2 if m.toss_winner == m.team1 else m.team1
        )
        if m.winner:
            total_decided += 1
            if m.winner == first_batting:
                bat_first_wins += 1

    venue_bat_first_pct = bat_first_wins / total_decided if total_decided else 0.5
    venue_chase_pct = 1 - venue_bat_first_pct

    sl_toss_win = 1 if input.toss_winner == "Sri Lanka" else 0

    # Determine if SL bats first
    if input.toss_winner == "Sri Lanka":
        sl_batting_first = 1 if input.toss_decision == "bat" else 0
    else:
        sl_batting_first = 1 if input.toss_decision == "field" else 0

    sl_form = _get_recent_form(db, "Sri Lanka")
    opp_form = _get_recent_form(db, input.team2 if input.team1 == "Sri Lanka" else input.team1)

    features = np.array([[
        venue_bat_first_pct,
        venue_chase_pct,
        sl_toss_win,
        sl_batting_first,
        sl_form,
        opp_form,
    ]])

    features_scaled = scaler.transform(features)
    prob = model.predict_proba(features_scaled)[0]
    sl_prob = round(float(prob[1]) * 100, 1)
    opp_prob = round(100 - sl_prob, 1)

    # Build explanation
    factors = []
    if venue_bat_first_pct > 0.55 and sl_batting_first:
        factors.append(f"Batting first at {input.venue_name} wins {round(venue_bat_first_pct*100)}% of the time")
    elif venue_chase_pct > 0.55 and not sl_batting_first:
        factors.append(f"Chasing at {input.venue_name} wins {round(venue_chase_pct*100)}% of the time")
    else:
        factors.append(f"Venue is relatively balanced (bat first wins {round(venue_bat_first_pct*100)}%)")

    if sl_form > opp_form:
        factors.append(f"Sri Lanka in better recent form ({round(sl_form*100)}% win rate vs opponent's {round(opp_form*100)}%)")
    elif opp_form > sl_form:
        factors.append(f"Opponent in better recent form ({round(opp_form*100)}% vs SL's {round(sl_form*100)}%)")

    if sl_toss_win:
        factors.append("Sri Lanka won the toss — can choose conditions")
    else:
        factors.append("Opponent won the toss — they control match conditions")

    recommendation = "Sri Lanka favoured to win" if sl_prob >= 50 else "Tough match — opponent holds slight edge"

    return PredictionOut(
        sl_win_probability=sl_prob,
        opponent_win_probability=opp_prob,
        recommendation=recommendation,
        key_factors=factors,
    )
