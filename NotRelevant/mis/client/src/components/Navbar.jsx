import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Content Platform</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/submission">Submit Content</Link>
<<<<<<< HEAD
        {/* <Link to="/about">About</Link> */}
        <Link to="/contracts">Contracts</Link>
=======
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
        <Link to="/browse">Browse Content</Link>
      </div>
    </nav>
  )
}