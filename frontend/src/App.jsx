import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Home from "./pages/Home";
import VenueWeather from "./pages/VenueWeather";
import PlayingXI from "./pages/PlayingXI";
import DLSCalculator from "./pages/DLSCalculator";
import AdminPanel from "./pages/AdminPanel";
import PlayerDashboard from "./pages/PlayerDashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ChatBot from "./components/ChatBot";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ChatBot />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/venue-weather" element={<VenueWeather />} />
                    <Route path="/playing-xi" element={<PlayingXI />} />
                    <Route path="/dls" element={<DLSCalculator />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/players" element={<PlayerDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <Footer />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
