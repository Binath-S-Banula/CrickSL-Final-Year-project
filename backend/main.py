from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import venues, players, matches, predictions, reports, weather, dls, xi_recommendation

app = FastAPI(
    title="CrickSL API",
    description="Cricket analytics decision support system for T20 matches",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(venues.router,             prefix="/venues",    tags=["Venues"])
app.include_router(players.router,            prefix="/players",   tags=["Players"])
app.include_router(matches.router,            prefix="/matches",   tags=["Matches"])
app.include_router(predictions.router,        prefix="/predict",   tags=["Prediction"])
app.include_router(reports.router,            prefix="/reports",   tags=["Reports"])
app.include_router(weather.router,            prefix="/weather",   tags=["Weather"])
app.include_router(dls.router,                prefix="/dls",       tags=["DLS Calculator"])
app.include_router(xi_recommendation.router,  prefix="/xi",        tags=["Playing XI"])

@app.get("/")
def root():
    return {
        "message": "CrickSL API 🏏",
        "version": "3.0.0",
        "sections": {
            "section_1": "Venue & Weather Analysis — /venues, /weather",
            "section_2": "Playing XI Recommendation — /xi",
            "section_3": "DLS Rain Calculator — /dls",
        }
    }

@app.get("/health")
def health():
    return {"status": "ok", "version": "3.0.0"}
