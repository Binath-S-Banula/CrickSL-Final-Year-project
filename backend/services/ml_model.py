"""
ml_model.py
───────────
Upgraded ML model for CrickSL v2.0.


Features used:
  1. venue_bat_first_win_pct    — historical win rate batting first at venue
  2. venue_chase_win_pct        — historical win rate chasing at venue
  3. sl_toss_win                — did Sri Lanka win toss? (1/0)
  4. sl_batting_first           — is Sri Lanka batting first? (1/0)
  5. sl_recent_form             — win rate in last 10 SL matches
  6. opponent_recent_form       — win rate in last 10 opponent matches
  7. dew_influence_factor       — venue historical dew influence (0-1)
  8. sl_batting_first_x_dew     — interaction: SL bats first AND high dew
  9. head_to_head_sl_win_pct    — SL win rate vs this specific opponent
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
_cached_model = None


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
        return 0.5

    wins = sum(1 for m in recent if m.winner == team)
    return round(wins / len(recent), 3)


def _get_head_to_head(db: Session, team1: str, team2: str, before_date=None) -> float:
    """
    Head-to-head win rate for team1 against team2.
    Returns team1's win percentage vs team2.
    """
    q = db.query(Match).filter(
        ((Match.team1 == team1) & (Match.team2 == team2)) |
        ((Match.team1 == team2) & (Match.team2 == team1)),
        Match.winner != None,
        Match.no_result == False,
    )

    if before_date:
        q = q.filter(Match.date < before_date)

    h2h_matches = q.all()
    if not h2h_matches:
        return 0.5

    team1_wins = sum(1 for m in h2h_matches if m.winner == team1)
    return round(team1_wins / len(h2h_matches), 3)


def _get_venue_dew_factor(db: Session, venue_id: int) -> float:
    """
    Returns venue dew influence factor.
    Higher = chasing teams benefit more = more dew influence.
    """
    from services.weather_analysis import get_venue_historical_dew_pattern
    historical = get_venue_historical_dew_pattern(db, venue_id)
    return historical["dew_influence_factor"]


def _build_features(db: Session, match: Match, for_team: str = "Sri Lanka") -> list:
    """Build complete feature vector for a single match."""
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

    # Toss and batting position
    sl_toss_win = 1 if match.toss_winner == for_team else 0
    first_batting = match.toss_winner if match.toss_decision == "bat" else (
        match.team2 if match.toss_winner == match.team1 else match.team1
    )
    sl_batting_first = 1 if first_batting == for_team else 0

    # Opponent
    opponent = match.team2 if match.team1 == for_team else match.team1

    # Form
    sl_form = _get_recent_form(db, for_team, before_date=match.date)
    opp_form = _get_recent_form(db, opponent, before_date=match.date)

    # NEW: Dew factor
    dew_factor = _get_venue_dew_factor(db, venue_id) if venue_id else 0.5

    # NEW: Dew interaction — if SL bats first at a high-dew venue, it's bad for SL
    # If SL chases at a high-dew venue, it's good for SL
    sl_batting_first_x_dew = sl_batting_first * dew_factor
    sl_chasing_x_dew = (1 - sl_batting_first) * dew_factor

    # NEW: Head to head
    h2h = _get_head_to_head(db, for_team, opponent, before_date=match.date)

    return [
        venue_bat_first_pct,     # Feature 1
        venue_chase_pct,         # Feature 2
        sl_toss_win,             # Feature 3
        sl_batting_first,        # Feature 4
        sl_form,                 # Feature 5
        opp_form,                # Feature 6
        dew_factor,              # Feature 7
        sl_batting_first_x_dew,  # Feature 8
        sl_chasing_x_dew,        # Feature 9
        h2h,                     # Feature 10
    ]


def train_model(db: Session):
    """Train upgraded model on all historical SL matches."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import classification_report

    print(" Training upgraded win probability model (v2.0)...")
    print("   New features: dew factor, head-to-head record, interaction terms")

    sl_matches = db.query(Match).filter(
        (Match.team1 == "Sri Lanka") | (Match.team2 == "Sri Lanka"),
        Match.winner != None,
        Match.no_result == False,
        Match.venue_id != None,
    ).all()

    print(f"   Found {len(sl_matches)} Sri Lanka matches")

    if len(sl_matches) < 30:
        print("   ⚠️ Not enough matches to train.")
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

    if X.ndim == 1 or len(X) == 0:
        print("   ❌ No valid feature vectors built. Check data.")
        return None

    print(f"   Built feature matrix: {X.shape[0]} samples × {X.shape[1]} features")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # Compare models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
    }

    # Try XGBoost if available
    try:
        from xgboost import XGBClassifier
        models["XGBoost"] = XGBClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            random_state=42,
            eval_metric="logloss",
            verbosity=0,
        )
        print("   XGBoost available ✅")
    except ImportError:
        print("   XGBoost not installed — using RF and LR only")

    results = {}
    for name, model in models.items():
        model.fit(X_train_s, y_train)
        acc = model.score(X_test_s, y_test)
        cv_scores = cross_val_score(model, X_train_s, y_train, cv=5)
        results[name] = {
            "model": model,
            "accuracy": acc,
            "cv_mean": cv_scores.mean(),
            "cv_std": cv_scores.std(),
        }
        print(f"   {name}: accuracy={acc:.3f}, CV={cv_scores.mean():.3f}±{cv_scores.std():.3f}")

    # Select best model by test accuracy

    best_name = max(results, key=lambda k: results[k]["accuracy"])
    best = results[best_name]
    print(f"\n   ✅ Best model: {best_name} (accuracy: {best['accuracy']:.3f})")

    # Feature importance for Random Forest / XGBoost
    feature_names = [
        "venue_bat_first_pct", "venue_chase_pct", "sl_toss_win",
        "sl_batting_first", "sl_form", "opp_form",
        "dew_factor", "sl_batting_first_x_dew", "sl_chasing_x_dew", "h2h"
    ]

    if hasattr(best["model"], "feature_importances_"):
        importances = best["model"].feature_importances_
        print("\n   Feature importances:")
        for fname, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
            bar = "█" * int(imp * 30)
            print(f"   {fname:<30} {bar} {imp:.3f}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "model": best["model"],
        "scaler": scaler,
        "model_name": best_name,
        "accuracy": best["accuracy"],
        "feature_names": feature_names,
        "version": "2.0",
    }, MODEL_PATH)
    print(f"\n   Model saved to {MODEL_PATH}")

    return {
        "model": best["model"],
        "scaler": scaler,
        "model_name": best_name,
        "accuracy": best["accuracy"],
    }


def _load_or_train(db: Session):
    global _cached_model
    if _cached_model:
        return _cached_model

    if MODEL_PATH.exists():
        _cached_model = joblib.load(MODEL_PATH)
        version = _cached_model.get("version", "1.0")
        print(f"✅ ML model loaded (version {version})")
        # If old version, retrain with new features
        if version != "2.0":
            print("   Old model version detected — retraining with new features...")
            _cached_model = train_model(db)
        return _cached_model

    _cached_model = train_model(db)
    return _cached_model


def predict_win_probability(db: Session, input: PredictionInput) -> Optional[PredictionOut]:
    """Predict Sri Lanka win probability with dew-aware features."""
    bundle = _load_or_train(db)
    if not bundle:
        return None

    model = bundle["model"]
    scaler = bundle["scaler"]

    # Get venue
    venue = db.query(Venue).filter(Venue.name == input.venue_name).first()
    if not venue:
        return None

    # Build venue stats
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

    if input.toss_winner == "Sri Lanka":
        sl_batting_first = 1 if input.toss_decision == "bat" else 0
    else:
        sl_batting_first = 1 if input.toss_decision == "field" else 0

    sl_form = _get_recent_form(db, "Sri Lanka")
    opponent = input.team2 if input.team1 == "Sri Lanka" else input.team1
    opp_form = _get_recent_form(db, opponent)

    # NEW: Dew factor
    from services.weather_analysis import get_venue_historical_dew_pattern
    historical = get_venue_historical_dew_pattern(db, venue.id)
    dew_factor = historical["dew_influence_factor"]

    sl_batting_first_x_dew = sl_batting_first * dew_factor
    sl_chasing_x_dew = (1 - sl_batting_first) * dew_factor

    # NEW: Head to head
    h2h = _get_head_to_head(db, "Sri Lanka", opponent)

    features = np.array([[
        venue_bat_first_pct,
        venue_chase_pct,
        sl_toss_win,
        sl_batting_first,
        sl_form,
        opp_form,
        dew_factor,
        sl_batting_first_x_dew,
        sl_chasing_x_dew,
        h2h,
    ]])

    features_scaled = scaler.transform(features)
    prob = model.predict_proba(features_scaled)[0]
    sl_prob = round(float(prob[1]) * 100, 1)
    opp_prob = round(100 - sl_prob, 1)

    # Build explanation factors
    factors = []

    # Venue factor
    if venue_bat_first_pct > 0.55 and sl_batting_first:
        factors.append(f"Batting first at {input.venue_name} wins {round(venue_bat_first_pct*100)}% of matches")
    elif venue_chase_pct > 0.55 and not sl_batting_first:
        factors.append(f"Chasing at {input.venue_name} wins {round(venue_chase_pct*100)}% of matches")
    else:
        factors.append(f"Venue is balanced (bat first wins {round(venue_bat_first_pct*100)}%)")

    # Form factor
    if sl_form > opp_form:
        factors.append(f"Sri Lanka in better recent form ({round(sl_form*100)}% vs opponent's {round(opp_form*100)}%)")
    elif opp_form > sl_form:
        factors.append(f"Opponent in better recent form ({round(opp_form*100)}% vs SL's {round(sl_form*100)}%)")

    # Dew factor
    from services.weather_analysis import risk_label
    dew_label = risk_label(dew_factor)
    if dew_factor > 0.5:
        if sl_batting_first:
            factors.append(f"Dew risk is {dew_label} at this venue — chasing team benefits, hurts SL batting first")
        else:
            factors.append(f"Dew risk is {dew_label} at this venue — chasing team benefits, favors SL")
    
    # Head to head factor
    if h2h > 0.6:
        factors.append(f"Sri Lanka has strong head-to-head record vs {opponent} ({round(h2h*100)}% win rate)")
    elif h2h < 0.4:
        factors.append(f"{opponent} has historical edge over Sri Lanka ({round((1-h2h)*100)}% win rate)")

    # Toss factor
    if sl_toss_win:
        factors.append("Sri Lanka won the toss — can choose conditions")
    else:
        factors.append("Opponent won the toss — they control match conditions")

    recommendation = "Sri Lanka favoured to win" if sl_prob >= 50 else "Tough match — opponent holds edge"

    return PredictionOut(
        sl_win_probability=sl_prob,
        opponent_win_probability=opp_prob,
        recommendation=recommendation,
        key_factors=factors,
    )
