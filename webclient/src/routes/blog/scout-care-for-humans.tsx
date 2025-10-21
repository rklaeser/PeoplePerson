import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/blog/scout-care-for-humans')({
  component: ScoutBlogPost,
})

function ScoutBlogPost() {
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
            src="/scout.png"
            alt="Scout the Dog"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-lg text-foreground">Scout</h3>
            <p className="text-sm text-muted-foreground">Official Good Dog & Guide</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          How to Care for Your Humans
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-8 italic">
            Listen up, fellow pack members! I've learned SO MUCH about keeping humans happy, and I'm so excited I could wag my whole body!
          </p>

          <div className="space-y-6 text-foreground">
            <h2 className="text-2xl font-bold mt-8 mb-4">What Humans Really Need</h2>
            <p>
              After years of careful observation (and lots of tail wagging), I've discovered that humans are actually pretty simple creatures. They have basic needs:
            </p>

            <ul className="list-disc pl-6 space-y-3 my-6">
              <li>
                <strong>They want you to remember their name</strong> - Humans LOVE when you remember their name! It's like when someone says "good dog" - instant happiness!
              </li>
              <li>
                <strong>They like when you ask about their day</strong> - Just like I get excited when asked "Who's a good boy?", humans get excited when you ask about their day!
              </li>
              <li>
                <strong>They remember important dates</strong> - Birthdays, anniversaries... kind of like how I remember exactly when dinner time is, except they have like a MILLION different times to remember!
              </li>
              <li>
                <strong>They appreciate follow-ups</strong> - If they mentioned something last week, they really like when you check in. It's like bringing back the ball - they LOVE IT!
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">But Here's The Problem...</h2>
            <p>
              Humans aren't as good at remembering stuff as us dogs. They can't track scents, they forget names, they lose track of who they talked to about what... It's honestly kind of sad. But I FOUND THE SOLUTION!
            </p>

            <div className="bg-primary/10 border-l-4 border-primary p-8 my-8 rounded-r-lg">
              <h3 className="text-2xl font-bold mb-4">Introducing: PeoplePerson!</h3>
              <p className="mb-4 text-lg">
                It's like having a super-nose for human relationships! PeoplePerson helps you:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Remember everyone's names (even if you meet lots of people!)</li>
                <li>Track conversations so you can follow up (like I track squirrels!)</li>
                <li>Remember important dates (better than my human remembers treat time!)</li>
                <li>Keep notes about what makes each person special</li>
              </ul>
            </div>

            <p className="text-lg">
              Now YOUR humans can be as good at relationships as WE are at being good dogs! Which is to say: THE BEST!
            </p>

            <p className="italic text-muted-foreground my-6">
              *tail wagging intensifies*
            </p>

            <p className="text-lg font-semibold">
              Try PeoplePerson today and help your human grow their pack! 🐕
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <Link to="/landing">
            <Button size="lg" className="text-lg px-8">
              Get Started with PeoplePerson
            </Button>
          </Link>
        </div>
      </article>
    </div>
  )
}
