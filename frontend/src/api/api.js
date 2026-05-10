import axios from "axios";

const BASE = "http://localhost:8000";
const api = axios.create({ baseURL: BASE });

// ─── Venues ────────────────────────────────────────────────────────
export const getVenues = () => api.get("/venues/?sl_only=true");
export const getVenueStats = (id, opponent) =>
  api.get(`/venues/${id}/stats`, {
    params: opponent ? { opponent_team: opponent } : {},
  });
export const getVenueParScore = (id, role, opponent) =>
  api.get(`/venues/${id}/par-score`, {
    params: { sl_role: role, opponent_team: opponent },
  });
export const getVenuePhaseStats = (id) => api.get(`/venues/${id}/phase-stats`);

// ─── Weather ────────────────────────────────────────────────────────
export const getWeatherConditions = (venue, batting, date) =>
  api.get("/weather/conditions", {
    params: { venue_name: venue, sl_batting_first: batting, match_date: date },
  });

// ─── Players ────────────────────────────────────────────────────────
export const getPlayers = (search) =>
  api.get("/players/", { params: search ? { search } : {} });
export const getSLSquad = () => api.get("/players/sri-lanka-squad");
export const getPlayerBatting = (name) =>
  api.get(`/players/${encodeURIComponent(name)}/batting`);
export const getPlayerBowling = (name) =>
  api.get(`/players/${encodeURIComponent(name)}/bowling`);
export const getMatchupAnalysis = (bowlerStyle, battingHand) =>
  api.get("/players/matchup-analysis", {
    params: { bowler_style: bowlerStyle, batting_hand: battingHand },
  });

// ─── Playing XI ─────────────────────────────────────────────────────
export const getXIRecommendation = (data) => api.post("/xi/recommend", data);
export const analyzeOpponentXI = (data) =>
  api.post("/xi/analyze-opponent", data);

// ─── DLS ────────────────────────────────────────────────────────────
export const calculateDLS = (data) => api.post("/dls/calculate", data);
export const getDLSParScore = (params) => api.get("/dls/par-score", { params });

// ─── Predictions ────────────────────────────────────────────────────
export const getPrediction = (data) => api.post("/predict/", data);

// ─── Matches ────────────────────────────────────────────────────────
export const getMatches = (params) => api.get("/matches/", { params });

// ─── Static data ────────────────────────────────────────────────────
export const TEAMS = [
  "India",
  "Australia",
  "England",
  "Pakistan",
  "South Africa",
  "New Zealand",
  "West Indies",
  "Bangladesh",
  "Afghanistan",
  "Zimbabwe",
  "Ireland",
  "Netherlands",
  "Scotland",
  "Nepal",
  "Oman",
];

export const SL_SQUAD = [
  "P Nissanka",
  "K Mishara",
  "BKG Mendis",
  "KIC Asalanka",
  "MD Shanaka",
  "DM de Silva",
  "DN Wellalage",
  "PHKD Mendis",
  "M Theekshana",
  "M Pathirana",
  "A Dananjaya",
  "J Liyanage",
  "B Fernando",
  "MADI Hemantha",
  "RMVD Gunaratne",
];

export default api;
