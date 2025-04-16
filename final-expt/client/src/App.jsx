import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Contracts from './pages/Contracts'
import Submission from './pages/Submission'
import Browse from './pages/Browse'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/submission" element={<Submission />} />
          <Route path="/browse" element={<Browse />} />
        </Routes>
      </div>
    </div>
  )
}