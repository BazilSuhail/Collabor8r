import { ReactLenis } from "lenis/react"
import { useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import { get } from '../utils/http'
import CanvasCursor from '../components/cursor/CanvasCursor'
import Hero from '../components/home/Hero'
import Features from '../components/home/Features'
import Words from '../components/home/Words'
import StatsSection from '../components/home/Stats'
import ProjectManagementSuite from '../components/home/ProjectManagementSuite'
import TechStackSlider from '../components/home/TechStackSlider'
import Pricing from '../components/home/Pricing'
import Footer from '../components/home/Footer'

const Home = () => {
  useEffect(() => {
    const key = 'serverWoken'
    if (!sessionStorage.getItem(key)) {
      get('/health')
      sessionStorage.setItem(key, 'true')
    }
  }, [])

  return (
    <ReactLenis root>
      <CanvasCursor />
      <div className="min-h-screen bg-white cursor-auto lg:cursor-none">
        <Navbar />

        <Hero />
        <TechStackSlider />
        <Words />
        <StatsSection />
        <ProjectManagementSuite />
        <Features />
        <Pricing />
        <Footer />
      </div>
    </ReactLenis>
  )
}

export default Home
