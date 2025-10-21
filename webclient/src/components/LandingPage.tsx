import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import BlogPreview from './BlogPreview'
import { Check } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: (animalGuide: 'Scout' | 'Nico') => void
  onLogin?: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [hoveredGuide, setHoveredGuide] = useState<'Scout' | 'Nico' | null>(null)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl text-foreground">
            People Person
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <button
                onClick={() => scrollToSection('blog')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Blog
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('learn')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Learn
              </button>
            </nav>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogin}
            >
              Log in
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-foreground mb-4">
            People Person
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Never forget a conversation. Always remember what matters. Build meaningful relationships at scale.
          </p>
        </div>

        {/* Animal Guide Selection */}
        <div className="w-full max-w-4xl" id="guides">
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
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-muted/30">
        <BlogPreview />
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            About PeoplePerson
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            In a world where we meet more people than ever before, it's impossible to remember everyone's names,
            their stories, and the conversations you've had. PeoplePerson is your personal relationship manager—a
            simple tool to help you remember the details that matter.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Remember Everything</h3>
              <p className="text-muted-foreground">
                Track conversations, interests, and important dates for everyone in your network.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Stay Connected</h3>
              <p className="text-muted-foreground">
                Get reminders to follow up and never let a relationship go cold.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Build Stronger Bonds</h3>
              <p className="text-muted-foreground">
                Turn casual acquaintances into meaningful relationships through thoughtful engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Pricing</h2>
            <p className="text-lg text-muted-foreground">Choose the plan that's right for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
                <p className="text-muted-foreground mb-4">
                  Discover the people person in you.
                </p>
                <div className="text-3xl font-bold text-foreground">
                  Free forever.
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Track up to 20 friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Unlimited conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Basic reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Relationship health tracking</span>
                </li>
              </ul>

              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => scrollToSection('guides')}
              >
                Start for Free
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Popular
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
                <p className="text-muted-foreground mb-4">
                  Everything you need to win friends and influence people.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">$20</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>

              <p className="text-sm text-foreground mb-4">All Free features, plus:</p>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Unlimited people tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Advanced analytics & insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Smart follow-up suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Calendar integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Export & backup features</span>
                </li>
              </ul>

              <Button
                size="lg"
                className="w-full"
                onClick={() => scrollToSection('guides')}
              >
                Upgrade now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Learn Section */}
      <section id="learn" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get started with PeoplePerson in three simple steps
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Choose Your Guide
                </h3>
                <p className="text-muted-foreground">
                  Start by selecting Scout or Nico as your companion. They'll help you navigate
                  the platform and make relationship management fun and intuitive.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Add Your People
                </h3>
                <p className="text-muted-foreground">
                  Import contacts or add people manually. For each person, track conversations,
                  interests, important dates, and any details that matter to you.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Stay Connected
                </h3>
                <p className="text-muted-foreground">
                  PeoplePerson reminds you when it's time to follow up, celebrates important dates,
                  and helps you maintain strong relationships with everyone who matters.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => scrollToSection('guides')}
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 PeoplePerson. Built with care by Scout and Nico.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
