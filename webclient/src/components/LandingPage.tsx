import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

interface LandingPageProps {
  onGetStarted: (animalGuide: 'Scout' | 'Nico') => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [hoveredGuide, setHoveredGuide] = useState<'Scout' | 'Nico' | null>(null)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full p-6 flex justify-end items-center">
        <Button variant="ghost" size="sm">
          Learn more
        </Button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-foreground mb-4">
            People Person
          </h1>
        </div>

        {/* Animal Guide Selection */}
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-center text-foreground mb-8">
            Choose Your Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Scout - Dog Guide */}
            <button
              onClick={() => onGetStarted('Scout')}
              onMouseEnter={() => setHoveredGuide('Scout')}
              onMouseLeave={() => setHoveredGuide(null)}
              className={`
                group relative overflow-hidden
                bg-card border-2 border-border rounded-2xl p-8
                transition-all duration-300 ease-in-out
                hover:border-primary hover:shadow-xl hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${hoveredGuide === 'Scout' ? 'border-primary shadow-xl scale-105' : ''}
              `}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-48 h-48 relative">
                  <img
                    src="/scout.png"
                    alt="Scout the Dog"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Scout
                </h3>
                <p className="text-muted-foreground italic">
                  "Bark! - so excited to help I peed"
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-primary/10 text-primary px-6 py-3 rounded-full font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Grow your pack
                  </span>
                </div>
              </div>
            </button>

            {/* Nico - Cat Guide */}
            <button
              onClick={() => onGetStarted('Nico')}
              onMouseEnter={() => setHoveredGuide('Nico')}
              onMouseLeave={() => setHoveredGuide(null)}
              className={`
                group relative overflow-hidden
                bg-card border-2 border-border rounded-2xl p-8
                transition-all duration-300 ease-in-out
                hover:border-primary hover:shadow-xl hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${hoveredGuide === 'Nico' ? 'border-primary shadow-xl scale-105' : ''}
              `}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-48 h-48 relative">
                  <img
                    src="/nico.png"
                    alt="Nico the Cat"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Nico
                </h3>
                <p className="text-muted-foreground">
                  <span className="italic">"Our empire will rival <span className="not-italic font-semibold">Rome!</span> I mean, meow."</span>
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-primary/10 text-primary px-6 py-3 rounded-full font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Build your empire
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage
