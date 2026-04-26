"""
Run this script ONCE to:
1. Create the users table in PostgreSQL
2. Create a default admin account
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
from models.db_models import User
from services.auth_service import hash_password
from sqlalchemy import text

print("Creating users table...")
Base.metadata.create_all(bind=engine, tables=[User.__table__])
print("✅ Users table created")

db = SessionLocal()

try:
    # Check if admin already exists
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("ℹ️  Admin account already exists — skipping seed")
    else:
        admin = User(
            username="admin",
            email="admin@cricksl.lk",
            hashed_password=hash_password("CrickSL@2026"),
            role="admin",
            is_active=True
        )
        analyst = User(
            username="analyst",
            email="analyst@cricksl.lk",
            hashed_password=hash_password("Analyst@2026"),
            role="analyst",
            is_active=True
        )
        db.add(admin)
        db.add(analyst)
        db.commit()
        print("✅ Default accounts created:")
        print("   Admin    → username: admin     | password: CrickSL@2026")
        print("   Analyst  → username: analyst   | password: Analyst@2026")
        print()
        print("⚠️  IMPORTANT: Change these passwords after first login!")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()

print("\n✅ Migration complete. You can now start the server.")
