"""
train_model.py
──────────────
Run this ONCE after loading data into the database to train the ML model.

Usage (from backend/ folder):
    python scripts/train_model.py
"""

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from services.ml_model import train_model

if __name__ == "__main__":
    db = SessionLocal()
    try:
        result = train_model(db)
        if result:
            print("\n✅ Model training complete! You can now use the /predict endpoint.")
        else:
            print("\n❌ Training failed — check your database has Sri Lanka match data.")
    finally:
        db.close()
