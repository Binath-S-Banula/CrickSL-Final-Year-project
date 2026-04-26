import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Home from './pages/Home'
import VenueWeather from './pages/VenueWeather'
import PlayingXI from './pages/PlayingXI'
import DLSCalculator from './pages/DLSCalculator'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes - require login */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <Routes>
                  <Route path="/"               element={<Home />} />
                  <Route path="/venue-weather"  element={<VenueWeather />} />
                  <Route path="/playing-xi"     element={<PlayingXI />} />
                  <Route path="/dls"            element={<DLSCalculator />} />
                  <Route path="*"               element={<Navigate to="/" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
