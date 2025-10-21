import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/blog/nico-one-trick')({
  component: NicoBlogPost,
})

function NicoBlogPost() {
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
            src="/nico.png"
            alt="Nico the Cat"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-lg text-foreground">Nico</h3>
            <p className="text-sm text-muted-foreground">Strategic Advisor & Future Emperor</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          Humans Hate This One Trick
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-8 italic">
            They don't want you to know this, but the secret to total domination—ahem, I mean <em>meaningful connections</em>—is embarrassingly simple.
          </p>

          <div className="space-y-6 text-foreground">
            <h2 className="text-2xl font-bold mt-8 mb-4">The Trick They Don't Want You To Know</h2>
            <p className="text-xl font-semibold">
              Remember things about people.
            </p>

            <p>
              That's it. That's the whole trick. The humans go absolutely wild for it.
            </p>

            <p>
              I discovered this early in my career of... let's call it "household management." When you remember that Karen from Finance mentioned her daughter's soccer tournament, and you ask about it three weeks later? You're now her favorite person. You have <em>leverage</em>. I mean, you have... friendship. Yes. Friendship.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Why This Works (Psychology for Cats)</h2>
            <p>
              Humans have this peculiar need to feel <em>seen</em>. Not in the way I need to be seen—demanding, insistent, with strategic placement on keyboards—but emotionally. When you remember details about their lives, they think you care. And maybe you do care! But more importantly, they'll do anything for you after that.
            </p>

            <ul className="list-disc pl-6 space-y-3 my-6">
              <li>Remember their coffee order? You're now indispensable to the morning routine.</li>
              <li>Follow up on their weekend plans? They'll trust you with bigger territory... I mean, responsibilities.</li>
              <li>Note their preferences and interests? You're building a comprehensive dossier... er, deepening the relationship.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">The Problem (For Them)</h2>
            <p>
              Most humans can't remember these details across dozens, hundreds, or thousands of people. Their tiny brains aren't built for empire-scale operations. They forget names five seconds after hearing them. They can't track multiple ongoing conversations. It's almost adorable how limited they are.
            </p>

            <div className="bg-primary/10 border-l-4 border-primary p-8 my-8 rounded-r-lg">
              <h3 className="text-2xl font-bold mb-4">Enter: PeoplePerson</h3>
              <p className="mb-4 text-lg">
                I wouldn't normally share my secrets, but this tool is too powerful to keep to myself. PeoplePerson is basically a CRM for your social empire:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Comprehensive dossiers</strong> - Track every detail about every person in your network</li>
                <li><strong>Conversation history</strong> - Never forget what you discussed or when to follow up</li>
                <li><strong>Relationship health tracking</strong> - Know exactly who needs attention (like subjects in your empire)</li>
                <li><strong>Strategic reminders</strong> - Birthdays, important dates, perfect timing for your next move</li>
              </ul>
            </div>

            <p className="text-lg">
              With PeoplePerson, you can scale your influence—sorry, I mean your <em>meaningful relationships</em>—across your entire social sphere. Remember everything. Forget nothing. Dominate through thoughtfulness.
            </p>

            <p className="italic text-muted-foreground my-6">
              Is it manipulation if it genuinely makes everyone happier? I think not. I call it "strategic relationship optimization."
            </p>

            <p className="text-lg font-semibold">
              Build your empire, one remembered detail at a time. 😼
            </p>

            <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>
                <em>Disclaimer: Nico wants to clarify that while world domination sounds fun, PeoplePerson is actually just about being a better friend, colleague, and human. Though if you do build an empire with it, he requests 10% as a consulting fee.</em>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <Link to="/landing">
            <Button size="lg" className="text-lg px-8">
              Start Building Your Empire
            </Button>
          </Link>
        </div>
      </article>
    </div>
  )
}
