import React from 'react'
import { Link } from '@tanstack/react-router'

const blogPosts = [
  {
    id: 'scout-care-for-humans',
    title: 'How to Care for Your Humans',
    author: 'Scout',
    authorImage: '/scout.png',
    authorTitle: 'Official Good Dog & Guide',
    excerpt: "Listen up, fellow pack members! I've learned SO MUCH about keeping humans happy, and I'm so excited I could wag my whole body! Discover the secrets to making your humans feel remembered and loved...",
    link: '/blog/scout-care-for-humans',
  },
  {
    id: 'nico-one-trick',
    title: 'Humans Hate This One Trick',
    author: 'Nico',
    authorImage: '/nico.png',
    authorTitle: 'Strategic Advisor & Future Emperor',
    excerpt: "They don't want you to know this, but the secret to total domination—ahem, I mean meaningful connections—is embarrassingly simple. Learn the psychology of influence...",
    link: '/blog/nico-one-trick',
  },
  {
    id: 'tom-dunbar-number',
    title: 'How I Blew Past the Dunbar Number with PeoplePerson',
    author: 'Tom',
    authorImage: '/tom.png',
    authorTitle: 'Neanderthal, Aspiring Homo Sapien',
    excerpt: "Look, I'll be honest with you. Blending in with you homo sapiens hasn't been easy. But thanks to PeoplePerson, I've managed to remember 300+ names. That's double the Dunbar number...",
    link: '/blog/tom-dunbar-number',
  },
]

const BlogPreview: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-16 mt-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-foreground mb-2">From Our Guides</h2>
        <p className="text-muted-foreground">Wisdom from those who know relationships best</p>
      </div>

      <div className="flex flex-col gap-6">
        {blogPosts.map((post) => (
          <Link
            key={post.id}
            to={post.link}
            className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all block cursor-pointer no-underline"
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                src={post.authorImage}
                alt={post.author}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-foreground">{post.author}</h3>
                <p className="text-xs text-muted-foreground">{post.authorTitle}</p>
              </div>
            </div>

            <h4 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
              {post.title}
            </h4>

            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {post.excerpt}
            </p>

            <div className="text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">
              Read more →
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default BlogPreview
