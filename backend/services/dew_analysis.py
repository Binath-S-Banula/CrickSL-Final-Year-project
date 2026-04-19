"""
dew_analysis.py
───────────────
Dew risk analysis service for CrickSL.

Two layers:
  1. Historical — calculates venue night vs day chase win rates
                  from existing match data in the database
  2. Forecast   — fetches real humidity/temperature forecast
                  from Open-Meteo API (free, no API key needed)

Dew Risk Score: 0.0 (no risk) to 1.0 (extreme risk)
"""

import httpx
from sqlalchemy.orm import Session
from models.db_models import Match, Venue
from typing import Optional
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from data.venue_coordinates import get_venue_coordinates
except ImportError:
    from venue_coordinates import get_venue_coordinates


# ── Humidity thresholds for dew risk scoring ──────────────────
DEW_RISK_THRESHOLDS = {
    "extreme": 85,   # humidity% → dew risk 1.0
    "high":    75,   # humidity% → dew risk 0.75
    "medium":  65,   # humidity% → dew risk 0.5
    "low":     55,   # humidity% → dew risk 0.25
}

# ── Sri Lanka monthly average evening humidity ─────────────────
# Fallback if API is unavailable. Based on Colombo climate data.
SL_MONTHLY_HUMIDITY = {
    1: 78, 2: 76, 3: 78, 4: 80,
    5: 82, 6: 83, 7: 82, 8: 81,
    9: 82, 10: 83, 11: 83, 12: 80
}

# General tropical/humid country fallback
COUNTRY_HUMIDITY_FALLBACK = {
    "Sri Lanka": 82,
    "Bangladesh": 83,
    "India": 75,
    "Pakistan": 65,
    "West Indies": 78,
    "UAE": 70,
    "Australia": 60,
    "England": 72,
    "New Zealand": 68,
    "South Africa": 62,
}


def calculate_humidity_dew_risk(humidity: float) -> float:
    """Convert humidity percentage to dew risk score 0.0–1.0"""
    if humidity >= DEW_RISK_THRESHOLDS["extreme"]:
        return 1.0
    elif humidity >= DEW_RISK_THRESHOLDS["high"]:
        return 0.75
    elif humidity >= DEW_RISK_THRESHOLDS["medium"]:
        return 0.5
    elif humidity >= DEW_RISK_THRESHOLDS["low"]:
        return 0.25
    else:
        return 0.1


def get_dew_risk_label(score: float) -> str:
    """Convert dew risk score to human-readable label"""
    if score >= 0.9:
        return "EXTREME"
    elif score >= 0.7:
        return "HIGH"
    elif score >= 0.45:
        return "MEDIUM"
    elif score >= 0.2:
        return "LOW"
    else:
        return "MINIMAL"


def get_venue_historical_dew_pattern(db: Session, venue_id: int) -> dict:
    """
    Analyzes historical match data to calculate dew influence.
    Compares night match chase win rates vs overall chase win rates.
    Night matches = matches where dew is a factor.
    """
    matches = db.query(Match).filter(
        Match.venue_id == venue_id,
        Match.winner != None,
        Match.no_result == False,
    ).all()

    if not matches:
        return {
            "total_matches": 0,
            "overall_chase_win_pct": 50.0,
            "dew_influence_factor": 0.5,
            "toss_field_win_pct": 50.0,
        }

    # Calculate overall chase win rate
    bat_first_wins = 0
    chase_wins = 0
    toss_field_wins = 0
    toss_total = 0

    for m in matches:
        if not m.winner or not m.toss_decision:
            continue

        # Who batted first?
        first_batting = m.toss_winner if m.toss_decision == "bat" else (
            m.team2 if m.toss_winner == m.team1 else m.team1
        )

        if m.winner == first_batting:
            bat_first_wins += 1
        else:
            chase_wins += 1

        # Did team that chose to field win?
        if m.toss_decision == "field":
            toss_total += 1
            if m.winner == m.toss_winner:
                toss_field_wins += 1

    total = bat_first_wins + chase_wins
    chase_win_pct = round(chase_wins / total * 100, 1) if total else 50.0
    toss_field_win_pct = round(toss_field_wins / toss_total * 100, 1) if toss_total else 50.0

    # Dew influence = how much chasing teams benefit at this venue
    # If chase win > 55%, dew is likely a factor
    dew_influence = min(1.0, max(0.0, (chase_win_pct - 50) / 30))

    return {
        "total_matches": len(matches),
        "overall_chase_win_pct": chase_win_pct,
        "dew_influence_factor": round(dew_influence, 3),
        "toss_field_win_pct": toss_field_win_pct,
    }


async def fetch_weather_forecast(lat: float, lon: float, match_date: str) -> Optional[dict]:
    """
    Fetches weather forecast from Open-Meteo API.
    Free API — no key needed.
    Returns humidity and temperature for the match date.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "relative_humidity_2m,temperature_2m,dewpoint_2m",
        "start_date": match_date,
        "end_date": match_date,
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                hourly = data.get("hourly", {})

                # Get evening values (6pm-9pm = indices 18-21)
                humidity_values = hourly.get("relative_humidity_2m", [])
                temp_values = hourly.get("temperature_2m", [])
                dewpoint_values = hourly.get("dewpoint_2m", [])

                # Evening average (18:00 - 21:00)
                evening_humidity = []
                evening_temp = []
                evening_dewpoint = []

                for i in range(18, min(22, len(humidity_values))):
                    if humidity_values[i]:
                        evening_humidity.append(humidity_values[i])
                    if temp_values[i]:
                        evening_temp.append(temp_values[i])
                    if dewpoint_values[i]:
                        evening_dewpoint.append(dewpoint_values[i])

                avg_humidity = sum(evening_humidity) / len(evening_humidity) if evening_humidity else None
                avg_temp = sum(evening_temp) / len(evening_temp) if evening_temp else None
                avg_dewpoint = sum(evening_dewpoint) / len(evening_dewpoint) if evening_dewpoint else None

                if avg_humidity:
                    return {
                        "humidity": round(avg_humidity, 1),
                        "temperature": round(avg_temp, 1) if avg_temp else None,
                        "dewpoint": round(avg_dewpoint, 1) if avg_dewpoint else None,
                        "source": "Open-Meteo API",
                    }
    except Exception as e:
        print(f"Weather API error: {e}")

    return None


def get_fallback_humidity(venue_name: str, country: str, month: int) -> float:
    """
    Returns estimated humidity when API is unavailable.
    Uses country-based fallback values.
    """
    if country == "Sri Lanka":
        return SL_MONTHLY_HUMIDITY.get(month, 80)
    return COUNTRY_HUMIDITY_FALLBACK.get(country, 70)


async def calculate_dew_risk(
    db: Session,
    venue_name: str,
    match_date: Optional[str] = None,
    match_month: Optional[int] = None,
) -> dict:
    """
    Main dew risk calculation function.
    Combines historical venue patterns with weather forecast.

    Returns a complete dew risk assessment dict.
    """
    # Get venue from DB
    venue = db.query(Venue).filter(Venue.name == venue_name).first()
    if not venue:
        return {"error": f"Venue '{venue_name}' not found"}

    # Get historical patterns
    historical = get_venue_historical_dew_pattern(db, venue.id)

    # Get venue coordinates
    coords = get_venue_coordinates(venue_name)

    # Try to get weather forecast
    weather_data = None
    humidity = None

    if coords and match_date:
        weather_data = await fetch_weather_forecast(
            coords["lat"], coords["lon"], match_date
        )

    if weather_data:
        humidity = weather_data["humidity"]
        humidity_source = "Live weather forecast"
    elif coords and match_month:
        # Use fallback humidity
        country = coords.get("country", "Unknown")
        humidity = get_fallback_humidity(venue_name, country, match_month)
        humidity_source = f"Historical average for {country} in month {match_month}"
    else:
        # Use venue historical dew influence as proxy
        humidity = 70 + (historical["dew_influence_factor"] * 20)
        humidity_source = "Estimated from venue historical data"

    # Calculate dew risk score
    dew_risk_score = calculate_humidity_dew_risk(humidity)

    # Blend with historical dew influence
    # Weight: 60% humidity-based + 40% historical pattern
    blended_score = round(
        (dew_risk_score * 0.6) + (historical["dew_influence_factor"] * 0.4), 3
    )

    risk_label = get_dew_risk_label(blended_score)

    # Generate impact statements
    impacts = []
    recommendations = []

    if blended_score >= 0.7:
        impacts.append("Spinners will struggle to grip the ball from over 12 onwards")
        impacts.append("Outfield will become slippery — fielding errors likely")
        impacts.append("Ball will skid onto bat — scoring will be easier for batting team")
        recommendations.append("WIN TOSS → FIELD FIRST")
        recommendations.append("Dew heavily favors the chasing team tonight")
        recommendations.append("Avoid relying on spinners in death overs")
    elif blended_score >= 0.45:
        impacts.append("Moderate dew expected — spinners may lose grip after over 15")
        impacts.append("Chasing team has a slight advantage")
        recommendations.append("If winning toss, consider fielding first")
        recommendations.append("Have backup plan if spinners struggle")
    elif blended_score >= 0.2:
        impacts.append("Light dew possible but unlikely to be decisive")
        recommendations.append("Toss decision can be based on batting/bowling strength")
    else:
        impacts.append("Minimal dew risk — conditions should remain consistent")
        recommendations.append("Toss decision based on pitch condition and team balance")

    return {
        "venue_name": venue_name,
        "match_date": match_date,
        "dew_risk_score": blended_score,
        "dew_risk_label": risk_label,
        "humidity_pct": round(humidity, 1),
        "humidity_source": humidity_source,
        "weather_data": weather_data,
        "historical_analysis": {
            "total_matches_at_venue": historical["total_matches"],
            "chase_win_pct": historical["overall_chase_win_pct"],
            "toss_field_win_pct": historical["toss_field_win_pct"],
            "dew_influence_factor": historical["dew_influence_factor"],
        },
        "impacts": impacts,
        "recommendations": recommendations,
        "toss_suggestion": recommendations[0] if recommendations else "No clear recommendation",
    }
