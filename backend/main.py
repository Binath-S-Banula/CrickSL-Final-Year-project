from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import venues, players, matches, predictions, reports

app = FastAPI(
    title="CrickSL API",
    description="Cricket analytics decision support system for T20 matches",
    version="1.0.0",
)

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(venues.router, prefix="/venues", tags=["Venues"])
app.include_router(players.router, prefix="/players", tags=["Players"])
app.include_router(matches.router, prefix="/matches", tags=["Matches"])
app.include_router(predictions.router, prefix="/predict", tags=["Prediction"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])


@app.get("/")
def root():
    return {"message": "CrickSL API is running 🏏"}


@app.get("/health")
def health():
    return {"status": "ok"}
