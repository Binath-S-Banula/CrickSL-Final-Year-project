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
from routers.player_dashboard import router as player_dashboard_router
from routers.admin_data import router as admin_data_router
from routers.chat import router as chat_router

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
app.include_router(auth_router)
app.include_router(player_dashboard_router, prefix="/players", tags=["player-dashboard"])
app.include_router(venues.router,           prefix="/venues")
app.include_router(players.router,          prefix="/players")
app.include_router(admin_data_router,       prefix="/admin-data", tags=["admin-data"])
app.include_router(chat_router,             prefix="",            tags=["chat"])
app.include_router(matches.router,          prefix="/matches")
app.include_router(predictions.router,      prefix="/predict")
app.include_router(reports.router)
app.include_router(weather.router,          prefix="/weather")
app.include_router(dls.router,              prefix="/dls")
app.include_router(xi_recommendation.router, prefix="/xi")                                        


@app.get("/")
def root():
    return {
        "app": "CrickSL API",
        "version": "4.0.0",
        "status": "running",
        "docs": "/docs"
    }
