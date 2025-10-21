import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/blog/tom-dunbar-number')({
  component: TomBlogPost,
})

function TomBlogPost() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
          <Link to="/landing" className="font-bold text-xl text-foreground">
            People Person
          </Link>
        </div>
      </header>

      {/* Blog Post Content */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Author Header */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src="/tom.png"
            alt="Tom the Neanderthal"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-lg text-foreground">Tom</h3>
            <p className="text-sm text-muted-foreground">Neanderthal, Aspiring Homo Sapien</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          How I Blew Past the Dunbar Number with PeoplePerson
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-8 italic">
            Look, I'll be honest with you. Blending in with you homo sapiens hasn't been easy. But thanks to PeoplePerson, I've managed to remember 300+ names. That's double the Dunbar number. Take that, anthropology!
          </p>

          <div className="space-y-6 text-foreground">
            <h2 className="text-2xl font-bold mt-8 mb-4">The Problem: My Brain Is... Different</h2>
            <p>
              So here's the thing about being a Neanderthal trying to pass as a homo sapien in 2025: your brain is wired differently. Sure, we had bigger brains—shoutout to my ancestors—but you guys developed something we didn't: complex social networks.
            </p>

            <p>
              The Dunbar number says humans can maintain about 150 stable relationships. Well, I could barely manage 30 before everyone started blending together. "Was that Greg from accounting or Craig from the climbing gym?" I'd think, moments before calling someone by the wrong name at a networking event.
            </p>

            <p>
              Not great when you're trying to convince people you're "totally one of them" and "definitely not a genetic throwback."
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Discovery</h2>
            <p>
              I found PeoplePerson during a particularly desperate late-night Google session: "how to remember more than cave family size group of people."
            </p>

            <p>
              At first, I was skeptical. You homo sapiens have a lot of tools that promise to "optimize your social life" or whatever. But then I realized—this is exactly what I needed. It's like having a second brain. A backup brain. A brain that actually remembers things.
            </p>

            <div className="bg-primary/10 border-l-4 border-primary p-8 my-8 rounded-r-lg">
              <h3 className="text-2xl font-bold mb-4">What PeoplePerson Does For Me:</h3>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Remembers everyone's name</strong> - No more calling people "hey, you!" or "buddy" or "that homo sapien I met at the thing"</li>
                <li><strong>Tracks what we talked about</strong> - "How's your daughter's soccer season going?" instead of "Do you have children? Are sports involved?"</li>
                <li><strong>Reminds me to follow up</strong> - Apparently you're supposed to do this? Who knew!</li>
                <li><strong>Notes their interests</strong> - I can finally remember that Jessica likes rock climbing, not mountain climbing. Or wait, is it bouldering?</li>
                <li><strong>Stores birthdays and important dates</strong> - Showing up to birthdays = appearing to care = successful integration</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">Breaking the Dunbar Barrier</h2>
            <p>
              Within six months of using PeoplePerson, I had detailed profiles on 200 people. By month nine, I hit 300. I'm now maintaining more relationships than any Neanderthal has in the history of... well, history.
            </p>

            <p>
              The results have been incredible:
            </p>

            <ul className="list-disc pl-6 space-y-3 my-6">
              <li>People think I'm "surprisingly attentive" (translation: "for someone with such a prominent brow ridge")</li>
              <li>I get invited to things now (this is good, right?)</li>
              <li>Someone called me a "connector" at a party, which I think is a compliment</li>
              <li>I successfully organized a 50-person gathering, remembered everyone's names, AND their dietary restrictions</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Secret Sauce</h2>
            <p>
              Here's what really makes it work: PeoplePerson doesn't just store information—it helps you remember to USE it. The follow-up reminders are clutch. "You talked to Sarah 3 weeks ago about her job search" means I can check in with her. Boom. I look thoughtful. I look human. Mission accomplished.
            </p>

            <p>
              And the best part? Nobody knows I'm using it. They just think I'm "really good with people." If only they knew I was literally incapable of this level of social tracking without technological assistance.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">A Warning for Fellow... Aspiring People</h2>
            <p>
              If you're like me—whether you're literally a different species trying to blend in, or you just feel like you are—PeoplePerson is your secret weapon. The Dunbar number isn't a hard limit. It's just what your brain can handle WITHOUT tools.
            </p>

            <p>
              With the right tools, you can remember hundreds of people. You can be the most connected person in your social circle. You can go from "who's that guy?" to "Tom knows EVERYONE" in less than a year.
            </p>

            <p className="text-lg font-semibold">
              I broke through the Dunbar number. And if a Neanderthal can do it, so can you. 🦴
            </p>

            <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>
                <em>Tom is a Neanderthal living in San Francisco and working in tech (where else?). He's passionate about evolutionary biology, social dynamics, and pretending he's lactose intolerant when he's actually just intolerant of lactose because his species never developed that mutation. Follow his integration journey on PeoplePerson.</em>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <Link to="/landing">
            <Button size="lg" className="text-lg px-8">
              Break Your Own Barriers
            </Button>
          </Link>
        </div>
      </article>
    </div>
  )
}
