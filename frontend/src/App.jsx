import { Routes, Route } from 'react-router-dom'
import Navbar from './components/nav'
import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'
import Randomizer from './pages/Randomizer'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/randomizer" element={<Randomizer />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
