from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────

class VenueDisplayCreate(BaseModel):
    venue_id:     int
    display_name: str
    country:      str = "Sri Lanka"
    is_active:    bool = True
    notes:        Optional[str] = None

class VenueDisplayUpdate(BaseModel):
    display_name: Optional[str] = None
    country:      Optional[str] = None
    is_active:    Optional[bool] = None
    notes:        Optional[str] = None

class CountryCreate(BaseModel):
    name:       str
    code:       Optional[str] = None
    is_active:  bool = True
    sort_order: int = 99

class CountryUpdate(BaseModel):
    name:       Optional[str] = None
    code:       Optional[str] = None
    is_active:  Optional[bool] = None
    sort_order: Optional[int] = None


# ── Venue Display Endpoints ───────────────────────────────────────────

@router.get("/venues")
def list_venue_displays(country: Optional[str] = None, db: Session = Depends(get_db)):
    """List all venue_display entries, optionally filtered by country."""
    q = "SELECT vd.id, vd.venue_id, vd.display_name, vd.country, vd.is_active, vd.notes, v.name as raw_name FROM venue_display vd LEFT JOIN venues v ON v.id = vd.venue_id"
    params = {}
    if country:
        q += " WHERE vd.country = :country"
        params["country"] = country
    q += " ORDER BY vd.country, vd.display_name"
    rows = db.execute(text(q), params).fetchall()
    return [{"id": r[0], "venue_id": r[1], "display_name": r[2], "country": r[3],
             "is_active": r[4], "notes": r[5], "raw_name": r[6]} for r in rows]


@router.get("/venues/raw")
def list_raw_venues(db: Session = Depends(get_db)):
    """List all raw venues from the venues table for mapping."""
    rows = db.execute(text("SELECT id, name FROM venues ORDER BY name LIMIT 500")).fetchall()
    return [{"id": r[0], "name": r[1]} for r in rows]


@router.post("/venues")
def create_venue_display(body: VenueDisplayCreate, db: Session = Depends(get_db)):
    """Add a new clean venue entry."""
    existing = db.execute(text(
        "SELECT id FROM venue_display WHERE display_name = :dn"
    ), {"dn": body.display_name}).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="A venue with this display name already exists.")

    row = db.execute(text("""
        INSERT INTO venue_display (venue_id, display_name, country, is_active, notes)
        VALUES (:vid, :dn, :country, :active, :notes)
        RETURNING id
    """), {"vid": body.venue_id, "dn": body.display_name, "country": body.country,
           "active": body.is_active, "notes": body.notes}).fetchone()
    db.commit()
    return {"id": row[0], "message": "Venue created successfully."}


@router.patch("/venues/{venue_display_id}")
def update_venue_display(venue_display_id: int, body: VenueDisplayUpdate, db: Session = Depends(get_db)):
    """Update a venue_display entry."""
    existing = db.execute(text(
        "SELECT id FROM venue_display WHERE id = :id"
    ), {"id": venue_display_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Venue not found.")

    updates = {}
    if body.display_name is not None: updates["display_name"] = body.display_name
    if body.country is not None:      updates["country"] = body.country
    if body.is_active is not None:    updates["is_active"] = body.is_active
    if body.notes is not None:        updates["notes"] = body.notes

    if updates:
        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = venue_display_id
        db.execute(text(f"UPDATE venue_display SET {set_clause}, updated_at = NOW() WHERE id = :id"), updates)
        db.commit()
    return {"message": "Venue updated successfully."}


@router.delete("/venues/{venue_display_id}")
def delete_venue_display(venue_display_id: int, db: Session = Depends(get_db)):
    """Delete a venue_display entry."""
    db.execute(text("DELETE FROM venue_display WHERE id = :id"), {"id": venue_display_id})
    db.commit()
    return {"message": "Venue deleted."}


# ── Country Endpoints ─────────────────────────────────────────────────

@router.get("/countries")
def list_countries(db: Session = Depends(get_db)):
    """List all cricket countries."""
    rows = db.execute(text(
        "SELECT id, name, code, is_active, sort_order FROM cricket_countries ORDER BY sort_order, name"
    )).fetchall()
    return [{"id": r[0], "name": r[1], "code": r[2], "is_active": r[3], "sort_order": r[4]} for r in rows]


@router.post("/countries")
def create_country(body: CountryCreate, db: Session = Depends(get_db)):
    """Add a new country."""
    existing = db.execute(text(
        "SELECT id FROM cricket_countries WHERE name = :name"
    ), {"name": body.name}).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Country already exists.")

    row = db.execute(text("""
        INSERT INTO cricket_countries (name, code, is_active, sort_order)
        VALUES (:name, :code, :active, :order)
        RETURNING id
    """), {"name": body.name, "code": body.code, "active": body.is_active, "order": body.sort_order}).fetchone()
    db.commit()
    return {"id": row[0], "message": "Country added successfully."}


@router.patch("/countries/{country_id}")
def update_country(country_id: int, body: CountryUpdate, db: Session = Depends(get_db)):
    """Update a country."""
    updates = {}
    if body.name is not None:       updates["name"] = body.name
    if body.code is not None:       updates["code"] = body.code
    if body.is_active is not None:  updates["is_active"] = body.is_active
    if body.sort_order is not None: updates["sort_order"] = body.sort_order

    if updates:
        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = country_id
        db.execute(text(f"UPDATE cricket_countries SET {set_clause} WHERE id = :id"), updates)
        db.commit()
    return {"message": "Country updated."}


@router.delete("/countries/{country_id}")
def delete_country(country_id: int, db: Session = Depends(get_db)):
    """Delete a country."""
    db.execute(text("DELETE FROM cricket_countries WHERE id = :id"), {"id": country_id})
    db.commit()
    return {"message": "Country deleted."}


# ── Dataset Info ──────────────────────────────────────────────────────

@router.get("/dataset-info")
def get_dataset_info(db: Session = Depends(get_db)):
    """Return current dataset statistics."""
    try:
        matches = db.execute(text("SELECT COUNT(*), MIN(date), MAX(date) FROM matches")).fetchone()
        deliveries = db.execute(text("SELECT COUNT(*) FROM deliveries")).fetchone()
        players = db.execute(text("SELECT COUNT(*) FROM players")).fetchone()
        venues_count = db.execute(text("SELECT COUNT(*) FROM venues")).fetchone()
        sl_matches = db.execute(text(
            "SELECT COUNT(*) FROM matches WHERE team1='Sri Lanka' OR team2='Sri Lanka'"
        )).fetchone()
        return {
            "total_matches":    int(matches[0] or 0),
            "date_from":        str(matches[1]) if matches[1] else "—",
            "date_to":          str(matches[2]) if matches[2] else "—",
            "total_deliveries": int(deliveries[0] or 0),
            "total_players":    int(players[0] or 0),
            "total_venues":     int(venues_count[0] or 0),
            "sl_matches":       int(sl_matches[0] or 0),
        }
    except Exception as e:
        return {"error": str(e)}
