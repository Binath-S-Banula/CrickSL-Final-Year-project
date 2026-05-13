"""
weather_analysis.py
────────────────────
Unified weather conditions analysis for CrickSL.
Covers dew risk, rain probability, cloud cover and
their combined impact on Sri Lanka specifically.

Open-Meteo API used — completely free, no API key needed.
Venue coordinates fetched from venue_display table (admin-managed).
"""

import httpx
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.db_models import Match, Venue
from typing import Optional
from datetime import date

# ── THRESHOLDS ────────────────────────────────────────────────────────

HUMIDITY_THRESHOLDS = {"extreme": 85, "high": 75, "medium": 65, "low": 55}
RAIN_THRESHOLDS = {"high": 60, "medium": 35, "low": 15}
CLOUD_THRESHOLDS = {"heavy": 80, "moderate": 50, "light": 25}

SL_MONTHLY_HUMIDITY = {
    1: 78, 2: 76, 3: 78, 4: 80, 5: 82,
    6: 83, 7: 82, 8: 81, 9: 82, 10: 83, 11: 83, 12: 80
}


def risk_label(score: float) -> str:
    if score >= 0.85: return "EXTREME"
    elif score >= 0.65: return "HIGH"
    elif score >= 0.40: return "MEDIUM"
    elif score >= 0.20: return "LOW"
    else: return "MINIMAL"


def humidity_to_dew_score(h: float) -> float:
    if h >= HUMIDITY_THRESHOLDS["extreme"]: return 1.0
    elif h >= HUMIDITY_THRESHOLDS["high"]: return 0.75
    elif h >= HUMIDITY_THRESHOLDS["medium"]: return 0.5
    elif h >= HUMIDITY_THRESHOLDS["low"]: return 0.25
    return 0.1


def rain_prob_to_score(p: float) -> float:
    if p >= RAIN_THRESHOLDS["high"]: return 1.0
    elif p >= RAIN_THRESHOLDS["medium"]: return 0.6
    elif p >= RAIN_THRESHOLDS["low"]: return 0.3
    return 0.1


def cloud_to_swing_score(c: float) -> float:
    if c >= CLOUD_THRESHOLDS["heavy"]: return 1.0
    elif c >= CLOUD_THRESHOLDS["moderate"]: return 0.6
    elif c >= CLOUD_THRESHOLDS["light"]: return 0.3
    return 0.1


# ── HISTORICAL ANALYSIS ───────────────────────────────────────────────

def get_venue_historical_dew_pattern(db: Session, venue_id: int) -> dict:
    matches = db.query(Match).filter(
        Match.venue_id == venue_id,
        Match.winner != None,
        Match.no_result == False,
    ).all()

    if not matches:
        return {"total_matches": 0, "overall_chase_win_pct": 50.0,
                "dew_influence_factor": 0.5, "toss_field_win_pct": 50.0}

    bat_first_wins, chase_wins, toss_field_wins, toss_total = 0, 0, 0, 0

    for m in matches:
        if not m.winner or not m.toss_decision:
            continue
        fb = m.toss_winner if m.toss_decision == "bat" else (
            m.team2 if m.toss_winner == m.team1 else m.team1
        )
        if m.winner == fb:
            bat_first_wins += 1
        else:
            chase_wins += 1
        if m.toss_decision == "field":
            toss_total += 1
            if m.winner == m.toss_winner:
                toss_field_wins += 1

    total = bat_first_wins + chase_wins
    chase_pct = round(chase_wins / total * 100, 1) if total else 50.0
    toss_field_pct = round(toss_field_wins / toss_total * 100, 1) if toss_total else 50.0
    dew_influence = min(1.0, max(0.0, (chase_pct - 50) / 30))

    return {
        "total_matches": len(matches),
        "overall_chase_win_pct": chase_pct,
        "dew_influence_factor": round(dew_influence, 3),
        "toss_field_win_pct": toss_field_pct,
    }


# ── VENUE COORDINATES ─────────────────────────────────────────────────

def get_coords_from_db(db: Session, venue_id: int) -> Optional[dict]:
    """Fetch lat/lng from venue_display table (admin-managed)."""
    try:
        row = db.execute(text(
            "SELECT latitude, longitude FROM venue_display "
            "WHERE venue_id = :vid AND latitude IS NOT NULL LIMIT 1"
        ), {"vid": venue_id}).fetchone()
        if row and row[0] and row[1]:
            return {"lat": float(row[0]), "lon": float(row[1])}
    except Exception as e:
        print(f"Coords lookup error: {e}")
    return None


# ── WEATHER API ───────────────────────────────────────────────────────

async def fetch_weather_forecast(lat: float, lon: float, match_date: str) -> Optional[dict]:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "relative_humidity_2m,temperature_2m,dewpoint_2m,precipitation_probability,cloudcover",
        "start_date": match_date,
        "end_date": match_date,
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params)
            if r.status_code == 200:
                data = r.json()
                hourly = data.get("hourly", {})
                hum   = hourly.get("relative_humidity_2m", [])
                temp  = hourly.get("temperature_2m", [])
                dew   = hourly.get("dewpoint_2m", [])
                rain  = hourly.get("precipitation_probability", [])
                cloud = hourly.get("cloudcover", [])

                def eve_avg(lst):
                    vals = [lst[i] for i in range(18, min(22, len(lst))) if lst[i] is not None]
                    return round(sum(vals) / len(vals), 1) if vals else None

                return {
                    "humidity": eve_avg(hum),
                    "temperature": eve_avg(temp),
                    "dewpoint": eve_avg(dew),
                    "rain_probability": eve_avg(rain),
                    "cloud_cover": eve_avg(cloud),
                    "source": "Open-Meteo API (Live)",
                }
    except Exception as e:
        print(f"Weather API error: {e}")
    return None


# ── MAIN WEATHER ANALYSIS ─────────────────────────────────────────────

async def calculate_weather_conditions(
    db: Session,
    venue_name: str,
    sl_batting_first: bool = True,
    match_date: Optional[str] = None,
    match_month: Optional[int] = None,
) -> dict:
    """
    Unified weather conditions analysis.
    Calculates dew risk, rain risk, swing conditions
    and their combined impact on Sri Lanka specifically.
    """
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    if not venue:
        return {"error": f"Venue '{venue_name}' not found"}

    # Historical dew patterns
    historical = get_venue_historical_dew_pattern(db, venue.id)

    # Venue coordinates — from venue_display table (admin-managed, accurate GPS)
    coords = get_coords_from_db(db, venue.id)

    # Weather forecast
    weather = None
    if coords and match_date:
        weather = await fetch_weather_forecast(coords["lat"], coords["lon"], match_date)

    # Get weather values
    if weather and weather.get("humidity"):
        humidity      = weather["humidity"]
        rain_prob     = weather.get("rain_probability", 20)
        cloud_cover   = weather.get("cloud_cover", 40)
        weather_source = "Live forecast (Open-Meteo API)"
    else:
        month         = match_month or date.today().month
        humidity      = SL_MONTHLY_HUMIDITY.get(month, 78)
        rain_prob     = 25
        cloud_cover   = 50
        weather_source = "Historical average (API unavailable)"

    # ── Risk Scores ────────────────────────────────────────────────
    dew_score   = humidity_to_dew_score(humidity) * 0.6 + historical["dew_influence_factor"] * 0.4
    rain_score  = rain_prob_to_score(rain_prob)
    swing_score = cloud_to_swing_score(cloud_cover)

    dew_score   = round(dew_score, 3)
    rain_score  = round(rain_score, 3)
    swing_score = round(swing_score, 3)

    # ── Sri Lanka Specific Impact ──────────────────────────────────
    sl_impacts       = []
    recommendations  = []
    toss_factors     = []

    # DEW IMPACT
    if dew_score >= 0.65:
        if sl_batting_first:
            sl_impacts.append("🔴 HIGH DEW RISK — SL batting first is disadvantaged. "
                              "Opponent will chase with wet ball (easier to bat)")
            toss_factors.append("Dew strongly favors fielding first")
        else:
            sl_impacts.append("🟢 HIGH DEW RISK — SL chasing benefits. "
                              "Wet ball comes onto bat nicely, outfield faster")
            toss_factors.append("Dew favors SL chasing")
    elif dew_score >= 0.40:
        sl_impacts.append("🟡 MODERATE DEW — Spinners may struggle after over 15. "
                          "Plan bowling rotations accordingly")

    # RAIN IMPACT
    if rain_score >= 0.6:
        sl_impacts.append("🌧️ HIGH RAIN RISK — Match may be interrupted. "
                          "Conditions will be difficult for batting team when resumed.")
        if sl_batting_first:
            sl_impacts.append("⚠️ If SL bats first and rain interrupts — DLS target may disadvantage SL")
            recommendations.append("Consider DLS impact if batting first in rain-affected match")
        else:
            sl_impacts.append("✅ If SL chases — rain interruption with DLS could benefit SL "
                              "if they are ahead of par score")
    elif rain_score >= 0.3:
        sl_impacts.append("🌦️ MODERATE RAIN RISK — Some interruption possible. "
                          "After rain, pitch becomes soft — both pacers and spinners can benefit")

    # SWING/CLOUD IMPACT
    if swing_score >= 0.6:
        if sl_batting_first:
            sl_impacts.append("☁️ HEAVY CLOUD COVER — SL batters face swing early. "
                              "Opponent pace bowlers will get movement with new ball")
        else:
            sl_impacts.append("☁️ HEAVY CLOUD COVER — SL bowlers get swing with new ball. "
                              "Good opportunity to take early wickets")

    # ── Toss Recommendation ────────────────────────────────────────
    dew_weight   = dew_score * 1.5
    rain_weight  = rain_score * 1.0
    swing_weight = swing_score * 0.8

    field_first_score = dew_weight - swing_weight + (rain_weight * 0.3)

    if field_first_score > 0.5:
        toss_recommendation   = "FIELD FIRST — Dew heavily favors chasing team"
        recommendation_strength = "STRONG"
    elif field_first_score > 0.2:
        toss_recommendation   = "LEAN FIELD FIRST — Conditions slightly favor chasing"
        recommendation_strength = "MODERATE"
    elif field_first_score < -0.3:
        toss_recommendation   = "BAT FIRST — Swing conditions favor early bowling. Bat while pitch is good"
        recommendation_strength = "MODERATE"
    else:
        toss_recommendation   = "BALANCED — No strong weather-based toss advantage"
        recommendation_strength = "WEAK"

    return {
        "venue_name":       venue_name,
        "match_date":       match_date,
        "sl_batting_first": sl_batting_first,
        "weather_source":   weather_source,

        "conditions": {
            "humidity_pct":        round(humidity, 1),
            "rain_probability_pct": round(rain_prob, 1),
            "cloud_cover_pct":     round(cloud_cover, 1),
            "temperature":         weather.get("temperature") if weather else None,
            "dewpoint":            weather.get("dewpoint") if weather else None,
        },

        "risk_scores": {
            "dew_risk":        dew_score,
            "dew_risk_label":  risk_label(dew_score),
            "rain_risk":       rain_score,
            "rain_risk_label": risk_label(rain_score),
            "swing_conditions": swing_score,
            "swing_label":     risk_label(swing_score),
        },

        "historical_venue_data": {
            "total_matches":        historical["total_matches"],
            "chase_win_pct":        historical["overall_chase_win_pct"],
            "toss_field_win_pct":   historical["toss_field_win_pct"],
            "dew_influence_factor": historical["dew_influence_factor"],
        },

        "sl_impact_analysis":       sl_impacts,
        "toss_recommendation":      toss_recommendation,
        "recommendation_strength":  recommendation_strength,
        "toss_factors":             toss_factors,
    }
