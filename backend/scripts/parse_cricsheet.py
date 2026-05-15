"""
parse_cricsheet.py
──────────────────
Reads all Cricsheet JSON files from data/raw/ and produces three CSVs:
  - data/parsed/matches.csv
  - data/parsed/innings.csv
  - data/parsed/deliveries.csv

Usage:
    python scripts/parse_cricsheet.py

Put your unzipped JSON files inside:  backend/data/raw/
"""

import json
import os
import pandas as pd
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PARSED_DIR = Path(__file__).parent.parent / "data" / "parsed"
PARSED_DIR.mkdir(parents=True, exist_ok=True)


def get_phase(over_number: int) -> str:
    if over_number < 6:
        return "powerplay"
    elif over_number < 15:
        return "middle"
    else:
        return "death"


def parse_match(file_path: Path):
    """Parse a single Cricsheet JSON file. Returns (match_dict, innings_list, deliveries_list)."""
    with open(file_path) as f:
        data = json.load(f)

    info = data.get("info", {})
    cricsheet_id = file_path.stem

    # ── Match ────────────────────────────────────
    dates = info.get("dates", [])
    match_date = dates[0] if dates else None

    teams = info.get("teams", [])
    team1 = teams[0] if len(teams) > 0 else None
    team2 = teams[1] if len(teams) > 1 else None

    toss = info.get("toss", {})
    outcome = info.get("outcome", {})
    winner = outcome.get("winner", None)
    no_result = "result" in outcome and outcome["result"] == "no result"

    by = outcome.get("by", {})
    win_by_runs = by.get("runs", None)
    win_by_wickets = by.get("wickets", None)

    match_row = {
        "cricsheet_id": cricsheet_id,
        "date": match_date,
        "venue": info.get("venue", "Unknown"),
        "city": info.get("city", None),
        "team1": team1,
        "team2": team2,
        "toss_winner": toss.get("winner", None),
        "toss_decision": toss.get("decision", None),
        "winner": winner,
        "win_by_runs": win_by_runs,
        "win_by_wickets": win_by_wickets,
        "no_result": no_result,
        "season": info.get("season", None),
        "gender": info.get("gender", "male"),
    }

    # ── Innings + Deliveries ─────────────────────
    innings_rows = []
    delivery_rows = []

    for inn_idx, innings in enumerate(data.get("innings", []), start=1):
        batting_team = innings.get("team", "Unknown")
        bowling_team = team2 if batting_team == team1 else team1

        total_runs = 0
        total_wickets = 0
        last_over = 0

        for over_obj in innings.get("overs", []):
            over_num = over_obj.get("over", 0)
            last_over = over_num

            for ball_idx, delivery in enumerate(over_obj.get("deliveries", []), start=1):
                runs = delivery.get("runs", {})
                extras_detail = delivery.get("extras", {})
                wickets = delivery.get("wickets", [])

                is_wicket = len(wickets) > 0
                wicket_kind = wickets[0].get("kind") if is_wicket else None
                player_out = wickets[0].get("player_out") if is_wicket else None

                # Count wickets (not run outs for bowling stats)
                if is_wicket:
                    total_wickets += 1

                runs_batter = runs.get("batter", 0)
                runs_extras = runs.get("extras", 0)
                runs_total = runs.get("total", 0)
                total_runs += runs_total

                delivery_rows.append({
                    "match_cricsheet_id": cricsheet_id,
                    "innings_number": inn_idx,
                    "batting_team": batting_team,
                    "bowling_team": bowling_team,
                    "over_number": over_num,
                    "ball_number": ball_idx,
                    "phase": get_phase(over_num),
                    "batter": delivery.get("batter", ""),
                    "bowler": delivery.get("bowler", ""),
                    "non_striker": delivery.get("non_striker", ""),
                    "runs_batter": runs_batter,
                    "runs_extras": runs_extras,
                    "runs_total": runs_total,
                    "is_wide": "wides" in extras_detail,
                    "is_noball": "noballs" in extras_detail,
                    "is_bye": "byes" in extras_detail,
                    "is_legbye": "legbyes" in extras_detail,
                    "is_wicket": is_wicket,
                    "wicket_kind": wicket_kind,
                    "player_out": player_out,
                    "is_boundary_four": runs_batter == 4,
                    "is_boundary_six": runs_batter == 6,
                })

        innings_rows.append({
            "match_cricsheet_id": cricsheet_id,
            "innings_number": inn_idx,
            "batting_team": batting_team,
            "bowling_team": bowling_team,
            "total_runs": total_runs,
            "total_wickets": total_wickets,
            "total_overs": last_over + 1,
        })

    return match_row, innings_rows, delivery_rows


def main():
    json_files = list(RAW_DIR.glob("*.json"))

    if not json_files:
        print(f"❌ No JSON files found in {RAW_DIR}")
        print("   Copy your Cricsheet JSON files into: backend/data/raw/")
        return

    print(f"📂 Found {len(json_files)} JSON files. Parsing...")

    all_matches = []
    all_innings = []
    all_deliveries = []
    errors = []

    for i, fp in enumerate(json_files):
        try:
            match_row, innings_rows, delivery_rows = parse_match(fp)
            all_matches.append(match_row)
            all_innings.extend(innings_rows)
            all_deliveries.extend(delivery_rows)
        except Exception as e:
            errors.append((fp.name, str(e)))

        if (i + 1) % 200 == 0:
            print(f"   Parsed {i+1}/{len(json_files)}...")

    # Save CSVs
    matches_df = pd.DataFrame(all_matches)
    innings_df = pd.DataFrame(all_innings)
    deliveries_df = pd.DataFrame(all_deliveries)

    matches_path = PARSED_DIR / "matches.csv"
    innings_path = PARSED_DIR / "innings.csv"
    deliveries_path = PARSED_DIR / "deliveries.csv"

    matches_df.to_csv(matches_path, index=False)
    innings_df.to_csv(innings_path, index=False)
    deliveries_df.to_csv(deliveries_path, index=False)

    print(f"\n✅ Done!")
    print(f"   Matches:    {len(matches_df):,}  rows  →  {matches_path}")
    print(f"   Innings:    {len(innings_df):,}  rows  →  {innings_path}")
    print(f"   Deliveries: {len(deliveries_df):,}  rows  →  {deliveries_path}")

    if errors:
        print(f"\n⚠️  {len(errors)} files failed to parse:")
        for name, err in errors[:10]:
            print(f"   {name}: {err}")


if __name__ == "__main__":
    main()
