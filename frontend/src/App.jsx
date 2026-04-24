import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import VenueWeather from './pages/VenueWeather'
import PlayingXI from './pages/PlayingXI'
import DLSCalculator from './pages/DLSCalculator'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/venue-weather" element={<VenueWeather />} />
        <Route path="/playing-xi" element={<PlayingXI />} />
        <Route path="/dls" element={<DLSCalculator />} />
      </Routes>
    </BrowserRouter>
  )
}
