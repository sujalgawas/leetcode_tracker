import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">
        LeetTracker
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Dashboard
        </NavLink>
        <NavLink to="/roadmap" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Roadmap
        </NavLink>
        <NavLink to="/randomizer" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Randomizer
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar