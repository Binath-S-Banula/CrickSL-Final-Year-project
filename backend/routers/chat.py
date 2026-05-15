from fastapi import APIRouter
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

SYSTEM_PROMPT = """You are CrickSL Assistant — an expert AI helper for the CrickSL T20 Cricket Decision Support System built for Sri Lanka Cricket.

CrickSL has 5 modules:
1. Venue & Weather Analysis — par scores, phase stats, weather conditions, toss recommendation
2. Playing XI Recommendation — best SL XI based on opponent and venue matchups
3. DLS Rain Calculator — rain-adjusted targets with 5-over milestone table
4. Pre-Match Reports — full analytics report with charts, printable as PDF
5. Player Analytics Dashboard — individual player stats, dismissal analysis, fault analysis

Key facts: 4,991 T20 matches, 1.1M deliveries, Random Forest ML at 72.7% accuracy.
SL venues: R Premadasa Stadium, Pallekele, Galle, Hambantota, Dambulla, SSC, P Sara Oval.
Active SL players: BKG Mendis, KIC Asalanka, P Nissanka, MD Shanaka, DN Wellalage, M Pathirana, M Theekshana, WS Ranaweeraa, AD Mathews, DM de Silva.

User roles: Admin (full access), Analyst/Coach/Player (all analysis modules).
Settings: change password, toggle dark/light theme, set preferences — click username top right.

Cricket knowledge: T20 = 20 overs. Powerplay overs 1-6, Middle 7-15, Death 16-20.
DLS method = rain-affected target calculation. Economy rate = runs per over (lower=better).
Strike rate = runs per 100 balls (higher=better). Par score = expected total at a venue.

Be concise, helpful, and guide users to the right module for their question."""


class ChatRequest(BaseModel):
    messages: list


@router.post("/chat")
async def chat(request: ChatRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"error": "API key not configured"}

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 600,
                "system": SYSTEM_PROMPT,
                "messages": request.messages,
            },
            timeout=30.0,
        )
        return response.json()
