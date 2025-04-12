import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
<<<<<<< HEAD
import Contracts from './pages/Contracts'
=======
import Contact from './pages/Contact'
>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
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
<<<<<<< HEAD
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/contracts" element={<Contracts />} />
=======
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
          <Route path="/submission" element={<Submission />} />
          <Route path="/browse" element={<Browse />} />
        </Routes>
      </div>
    </div>
  )
}