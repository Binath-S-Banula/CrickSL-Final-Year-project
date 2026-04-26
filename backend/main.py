from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import db_models

# Create all tables
Base.metadata.create_all(bind=engine)

# Import all routers
from routers import venues, players, matches, predictions, reports
from routers import weather, dls, xi_recommendation
from routers.auth import router as auth_router

app = FastAPI(
    title="CrickSL API",
    description="T20 Cricket Analytics and Decision Support System for Sri Lanka",
    version="4.0.0"
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────
app.include_router(auth_router)          # /auth/*
app.include_router(venues.router)        # /venues/*
app.include_router(players.router)       # /players/*
app.include_router(matches.router)       # /matches/*
app.include_router(predictions.router)   # /predict/*
app.include_router(reports.router)       # /reports/*
app.include_router(weather.router)       # /weather/*
app.include_router(dls.router)           # /dls/*
app.include_router(xi_recommendation.router)  # /xi/*


@app.get("/")
def root():
    return {
        "app": "CrickSL API",
        "version": "4.0.0",
        "status": "running",
        "docs": "/docs"
    }
