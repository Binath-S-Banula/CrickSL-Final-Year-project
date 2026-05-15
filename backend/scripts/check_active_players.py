import sys
sys.path.insert(0, '.')
from database import SessionLocal
from models.db_models import Match, Innings, Delivery
from datetime import date, timedelta

db = SessionLocal()
cutoff = date.today() - timedelta(days=3*365)

print(f"Checking SL players since: {cutoff}")

match_ids = [m.id for m in db.query(Match).filter(
    (Match.team1 == 'Sri Lanka') | (Match.team2 == 'Sri Lanka'),
    Match.date >= cutoff
).all()]

print(f"SL matches in last 3 years: {len(match_ids)}")

inn_ids = [i.id for i in db.query(Innings).filter(
    Innings.match_id.in_(match_ids),
    Innings.batting_team == 'Sri Lanka'
).all()]

batters = db.query(Delivery.batter).filter(
    Delivery.innings_id.in_(inn_ids)
).distinct().all()

bowl_inn_ids = [i.id for i in db.query(Innings).filter(
    Innings.match_id.in_(match_ids),
    Innings.bowling_team == 'Sri Lanka'
).all()]

bowlers = db.query(Delivery.bowler).filter(
    Delivery.innings_id.in_(bowl_inn_ids)
).distinct().all()

all_names = sorted(set([b.batter for b in batters] + [b.bowler for b in bowlers]))

print(f"\nTotal active SL players found: {len(all_names)}")
print("-" * 40)
for n in all_names:
    print(n)

db.close()
