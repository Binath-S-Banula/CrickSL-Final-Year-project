"""
analytics.py - CrickSL v2.0
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models.db_models import Match, Innings, Delivery, Venue, Player
from models.schemas import VenueStats, PhaseStats, BattingStats, BowlingStats, TopBatter, TopBowler
from typing import List, Optional


def get_venue_par_score(db, venue_id, sl_role="batting", opponent_team=None):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        return {"error": "Venue not found"}
    # Normalize opponent team name to title case
    if opponent_team:
        opponent_team = opponent_team.strip().title()
    results = {}
    all_first = db.query(Innings).filter(
        Innings.match_id.in_(db.query(Match.id).filter(Match.venue_id==venue_id, Match.no_result==False)),
        Innings.innings_number==1, Innings.total_runs>0,
    ).all()
    overall_avg = round(sum(i.total_runs for i in all_first)/len(all_first),1) if all_first else 0.0
    results["overall_venue_average"] = {"par_score": overall_avg, "matches": len(all_first),
        "confidence": "LOW" if len(all_first)<5 else "MEDIUM" if len(all_first)<15 else "HIGH"}
    sl_mids = [m.id for m in db.query(Match).filter(Match.venue_id==venue_id, Match.no_result==False,
        (Match.team1=="Sri Lanka")|(Match.team2=="Sri Lanka")).all()]
    if sl_role=="batting":
        sl_inn = db.query(Innings).filter(Innings.match_id.in_(sl_mids),
            Innings.batting_team=="Sri Lanka", Innings.innings_number==1, Innings.total_runs>0).all()
    else:
        sl_inn = db.query(Innings).filter(Innings.match_id.in_(sl_mids),
            Innings.batting_team!="Sri Lanka", Innings.innings_number==1, Innings.total_runs>0).all()
    sl_avg = round(sum(i.total_runs for i in sl_inn)/len(sl_inn),1) if sl_inn else 0.0
    results["sl_at_venue"] = {"par_score": sl_avg, "matches": len(sl_inn),
        "confidence": "LOW" if len(sl_inn)<3 else "MEDIUM" if len(sl_inn)<8 else "HIGH",
        "note": f"SL {sl_role} first at {venue.name}"}
    sl_vs_opp_avg = 0.0
    sl_vs_opp_matches = 0
    if opponent_team:
        opp_mids = [m.id for m in db.query(Match).filter(Match.venue_id==venue_id, Match.no_result==False,
            (((Match.team1=="Sri Lanka")&(Match.team2==opponent_team))|
             ((Match.team1==opponent_team)&(Match.team2=="Sri Lanka")))).all()]
        if sl_role=="batting":
            opp_inn = db.query(Innings).filter(Innings.match_id.in_(opp_mids),
                Innings.batting_team=="Sri Lanka", Innings.innings_number==1, Innings.total_runs>0).all()
        else:
            opp_inn = db.query(Innings).filter(Innings.match_id.in_(opp_mids),
                Innings.batting_team==opponent_team, Innings.innings_number==1, Innings.total_runs>0).all()
        sl_vs_opp_matches = len(opp_inn)
        sl_vs_opp_avg = round(sum(i.total_runs for i in opp_inn)/len(opp_inn),1) if opp_inn else 0.0
        conf = "INSUFFICIENT" if sl_vs_opp_matches<3 else "LOW" if sl_vs_opp_matches<5 else "MEDIUM" if sl_vs_opp_matches<10 else "HIGH"
        results["sl_vs_opponent_at_venue"] = {"par_score": sl_vs_opp_avg, "matches": sl_vs_opp_matches,
            "opponent": opponent_team, "confidence": conf}
    # Use most specific data available — lowered threshold to 3 matches
    if opponent_team and sl_vs_opp_matches >= 3 and sl_vs_opp_avg > 0:
        recommended = sl_vs_opp_avg
        source = f"SL vs {opponent_team} at {venue.name}"
        conf = results["sl_vs_opponent_at_venue"]["confidence"]
        data_level = "opponent_specific"
    elif len(sl_inn) >= 3 and sl_avg > 0:
        recommended = sl_avg
        source = f"SL at {venue.name}"
        conf = results["sl_at_venue"]["confidence"]
        data_level = "sl_at_venue"
    elif overall_avg > 0:
        recommended = overall_avg
        source = f"Overall {venue.name} average"
        conf = results["overall_venue_average"]["confidence"]
        data_level = "overall_venue"
    else:
        recommended = 150.0
        source = "T20 International average (insufficient venue data)"
        conf = "VERY LOW"
        data_level = "global_default"

    interp = (
        f"SL should target {recommended} runs batting first"
        if sl_role == "batting"
        else f"SL should restrict {opponent_team or 'opponent'} to under {recommended} runs"
    )
    results["recommended"] = {
        "par_score": recommended,
        "source": source,
        "confidence": conf,
        "data_level": data_level,
        "sl_role": sl_role,
        "opponent": opponent_team,
        "interpretation": interp,
        "note": "Score changes with opponent when 3+ historical matches exist at this venue"
    }
    return results


def get_venue_stats(db, venue_id, opponent_team=None):
    venue = db.query(Venue).filter(Venue.id==venue_id).first()
    if not venue:
        return None
    matches = db.query(Match).filter(Match.venue_id==venue_id, Match.no_result==False, Match.winner!=None).all()
    if not matches:
        return VenueStats(venue_id=venue_id, venue_name=venue.name, total_matches=0,
            avg_first_innings_score=0, avg_second_innings_score=0, bat_first_wins=0,
            chase_wins=0, bat_first_win_pct=0, chase_win_pct=0, toss_recommendation="insufficient data")
    match_ids = [m.id for m in matches]
    inn = db.query(Innings).filter(Innings.match_id.in_(match_ids)).all()
    f1 = [i.total_runs for i in inn if i.innings_number==1]
    f2 = [i.total_runs for i in inn if i.innings_number==2]
    avg1 = round(sum(f1)/len(f1),1) if f1 else 0
    avg2 = round(sum(f2)/len(f2),1) if f2 else 0
    bfw, cw = 0, 0
    for m in matches:
        if not m.winner or not m.toss_decision: continue
        fb = m.toss_winner if m.toss_decision=="bat" else (m.team2 if m.toss_winner==m.team1 else m.team1)
        if m.winner==fb: bfw+=1
        else: cw+=1
    total = bfw+cw
    bfp = round(bfw/total*100,1) if total else 0
    cp = round(cw/total*100,1) if total else 0
    rec = "bat first" if bfp>=cp else "field first (chase)"
    return VenueStats(venue_id=venue_id, venue_name=venue.name, total_matches=len(matches),
        avg_first_innings_score=avg1, avg_second_innings_score=avg2, bat_first_wins=bfw,
        chase_wins=cw, bat_first_win_pct=bfp, chase_win_pct=cp, toss_recommendation=rec)


def get_venue_phase_stats(db, venue_id):
    match_ids = [m.id for m in db.query(Match.id).filter(Match.venue_id==venue_id).all()]
    if not match_ids: return []
    results = []
    for phase in ["powerplay","middle","death"]:
        d = db.query(Delivery).filter(Delivery.match_id.in_(match_ids), Delivery.phase==phase,
            Delivery.is_wide==False, Delivery.is_noball==False).all()
        if not d:
            results.append(PhaseStats(phase=phase, avg_runs=0, avg_wickets=0, total_deliveries=0)); continue
        omap = {"powerplay":6,"middle":9,"death":5}
        eo = omap[phase]*len(match_ids)
        results.append(PhaseStats(phase=phase,
            avg_runs=round(sum(x.runs_total for x in d)/eo,2) if eo else 0,
            avg_wickets=round(sum(1 for x in d if x.is_wicket)/eo,2) if eo else 0,
            total_deliveries=len(d)))
    return results


def get_batting_stats(db, player_name, venue_id=None):
    q = db.query(Delivery).filter(Delivery.batter==player_name, Delivery.is_wide==False)
    if venue_id:
        mids = [m.id for m in db.query(Match.id).filter(Match.venue_id==venue_id).all()]
        q = q.filter(Delivery.match_id.in_(mids))
    d = q.all()
    if not d: return None
    inn_set = set((x.match_id, x.innings_id) for x in d)
    runs = sum(x.runs_batter for x in d)
    balls = len(d)
    b4 = sum(1 for x in d if x.is_boundary_four)
    b6 = sum(1 for x in d if x.is_boundary_six)
    dots = sum(1 for x in d if x.runs_batter==0)
    dq = db.query(Delivery).filter(Delivery.player_out==player_name)
    if venue_id: dq = dq.filter(Delivery.match_id.in_(mids))
    dismissals = len(dq.all())
    avg = round(runs/dismissals,2) if dismissals else float(runs)
    sr = round(runs/balls*100,2) if balls else 0
    bp = round((b4+b6)/balls*100,1) if balls else 0
    dp = round(dots/balls*100,1) if balls else 0
    ir = {}
    for x in d:
        k=(x.match_id,x.innings_id); ir[k]=ir.get(k,0)+x.runs_batter
    high = max(ir.values()) if ir else 0
    return BattingStats(player_name=player_name, innings=len(inn_set), total_runs=runs,
        average=avg, strike_rate=sr, boundary_pct=bp, dot_ball_pct=dp, highest_score=high,
        fifties=sum(1 for r in ir.values() if 50<=r<100), hundreds=sum(1 for r in ir.values() if r>=100))


def get_bowling_stats(db, player_name, venue_id=None):
    q = db.query(Delivery).filter(Delivery.bowler==player_name)
    if venue_id:
        mids = [m.id for m in db.query(Match.id).filter(Match.venue_id==venue_id).all()]
        q = q.filter(Delivery.match_id.in_(mids))
    d = q.all()
    if not d: return None
    inn_set = set((x.match_id, x.innings_id) for x in d)
    legal = [x for x in d if not x.is_wide and not x.is_noball]
    rc = sum(x.runs_total for x in d if not x.is_bye and not x.is_legbye)
    wkts = sum(1 for x in d if x.is_wicket and x.wicket_kind not in ["run out"])
    balls = len(legal); overs = balls/6
    eco = round(rc/overs,2) if overs else 0
    bsr = round(balls/wkts,1) if wkts else None
    avg = round(rc/wkts,2) if wkts else None
    dots = sum(1 for x in legal if x.runs_total==0)
    dp = round(dots/balls*100,1) if balls else 0
    return BowlingStats(player_name=player_name, innings=len(inn_set), wickets=wkts,
        economy=eco, bowling_strike_rate=bsr, dot_ball_pct=dp, average=avg)


def get_top_batters_at_venue(db, team, venue_id, limit=5):
    # Try 3-year window first, fall back to 5 years if no data
    years = 10
    mids = []
    for y in [3, 5, 10]:
        cutoff = datetime.now().date() - timedelta(days=y*365)
        mids = [m.id for m in db.query(Match.id).filter(Match.venue_id==venue_id,
            Match.date >= cutoff,
            (Match.team1==team)|(Match.team2==team)).all()]
        if mids:
            years = y
            break
    if not mids: return [], years
    d = db.query(Delivery).filter(Delivery.match_id.in_(mids),
        Delivery.batting_team==team, Delivery.is_wide==False).all()
    stats = {}
    for x in d:
        if x.batter not in stats: stats[x.batter]={"runs":0,"balls":0,"innings":set()}
        stats[x.batter]["runs"]+=x.runs_batter; stats[x.batter]["balls"]+=1
        stats[x.batter]["innings"].add((x.match_id,x.innings_id))
    result = []
    for name,s in stats.items():
        if s["balls"]<10: continue
        ic=len(s["innings"])
        result.append(TopBatter(name=name, runs=s["runs"],
            average=round(s["runs"]/ic,1) if ic else 0,
            strike_rate=round(s["runs"]/s["balls"]*100,1) if s["balls"] else 0))
    result.sort(key=lambda x:x.runs, reverse=True)
    return result[:limit], years


def get_top_bowlers_at_venue(db, team, venue_id, limit=5):
    # Try 3-year window first, fall back to 5 years if no data
    years = 10
    mids = []
    for y in [3, 5, 10]:
        cutoff = datetime.now().date() - timedelta(days=y*365)
        mids = [m.id for m in db.query(Match.id).filter(Match.venue_id==venue_id,
            Match.date >= cutoff,
            (Match.team1==team)|(Match.team2==team)).all()]
        if mids:
            years = y
            break
    if not mids: return [], years
    d = db.query(Delivery).filter(Delivery.match_id.in_(mids), Delivery.bowling_team==team).all()
    stats = {}
    for x in d:
        if x.bowler not in stats: stats[x.bowler]={"runs":0,"balls":0,"wickets":0}
        if not x.is_wide and not x.is_noball: stats[x.bowler]["balls"]+=1
        if not x.is_bye and not x.is_legbye: stats[x.bowler]["runs"]+=x.runs_total
        if x.is_wicket and x.wicket_kind not in ["run out"]: stats[x.bowler]["wickets"]+=1
    result = []
    for name,s in stats.items():
        if s["balls"]<12: continue
        overs=s["balls"]/6
        avg = round(s["runs"]/s["wickets"],1) if s["wickets"] else 0.0
        result.append(TopBowler(name=name, wickets=s["wickets"],
            economy=round(s["runs"]/overs,2) if overs else 0,
            average=avg))
    result.sort(key=lambda x:x.wickets, reverse=True)
    return result[:limit], years
