"use client"

import type React from "react"
import { Calendar, User, ArrowLeft, Clock, Heart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function EmmaBreakthroughArticle() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/community" className="flex items-center space-x-2 text-black hover:text-main">
              <ArrowLeft className="h-6 w-6" />
              <span className="font-bold">Back to Community</span>
            </Link>
            <Link href="/login" className="bg-main text-main-foreground px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              JOIN NOW
            </Link>
          </div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <div className="mb-12">
          <div className="bg-chart-3 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-6 transform rotate-1">
            <span className="text-main-foreground font-bold">SUCCESS STORIES</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            Emma's First Breakthrough: From Anxiety to Confidence
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600 font-medium mb-8">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Jennifer K., Parent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>August 23, 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>5 min read</span>
            </div>
          </div>
          
          <div className="bg-black border-4 border-border shadow-brutal-xl overflow-hidden mb-8">
            <Image
              src="/happy-child-achievement.png"
              alt="Emma celebrating her gaming achievement"
              width={800}
              height={400}
              className="w-full h-64 object-cover"
            />
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white border-4 border-border shadow-brutal-xl p-8 mb-8">
            <p className="text-xl text-gray-700 font-medium leading-relaxed mb-6">
              When we first started with BrainBerry, my 8-year-old daughter Emma was struggling 
              with social anxiety and had difficulty connecting with other children. Today, 
              I'm excited to share how therapeutic gaming helped her find her confidence.
            </p>
            
            <h2 className="text-2xl font-bold text-black mb-4">The Challenge</h2>
            <p className="text-gray-700 font-medium mb-6">
              Emma has always been a bright, curious child, but social situations made her incredibly 
              anxious. She would shut down in group activities and avoided eye contact with peers. 
              Traditional therapy helped, but we needed something that would engage her interest 
              while building social skills.
            </p>
            
            <div className="bg-chart-1 border-4 border-border shadow-brutal-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-main-foreground mb-4">Emma's Initial Challenges:</h3>
              <ul className="space-y-2 text-main-foreground font-medium">
                <li>• Extreme social anxiety in group settings</li>
                <li>• Difficulty making eye contact</li>
                <li>• Avoided collaborative activities</li>
                <li>• Low self-confidence in social situations</li>
              </ul>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">Finding BrainBerry</h2>
            <p className="text-gray-700 font-medium mb-6">
              Emma's therapist recommended BrainBerry as a supplement to our regular sessions. 
              What immediately caught my attention was how the games could be personalized 
              with Emma's interests - she loves unicorns and art.
            </p>
            
            <div className="bg-white border-l-4 border-chart-2 pl-6 mb-6">
              <p className="text-gray-700 font-medium italic">
                "The first time Emma saw a memory matching game with unicorn cards that looked 
                like her drawings, her eyes just lit up. It was the first time I'd seen her 
                genuinely excited about an activity involving social skills."
              </p>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">The Breakthrough Moment</h2>
            <p className="text-gray-700 font-medium mb-6">
              After three weeks of playing personalized games at home, something amazing happened 
              during a session with the expression training game. Emma not only completed the 
              facial recognition challenges but started narrating what the characters might be feeling.
            </p>
            
            <div className="bg-chart-4 border-4 border-border shadow-brutal-xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="w-6 h-6 text-main-foreground" />
                <h3 className="text-xl font-bold text-main-foreground">The Moment Everything Changed</h3>
              </div>
              <p className="text-main-foreground font-medium">
                During week 4, Emma completed her first collaborative online game session with 
                another child through BrainBerry's supervised platform. She not only participated 
                but took the lead in solving several puzzles. Her confidence was transformed.
              </p>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">Progress Over Time</h2>
            <p className="text-gray-700 font-medium mb-6">
              The changes didn't happen overnight, but the consistent engagement with personalized 
              therapeutic games created a safe space for Emma to practice social skills without 
              the pressure of face-to-face interaction initially.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-chart-2 border-4 border-border shadow-brutal-xl p-4 text-center">
                <div className="text-2xl font-bold text-main-foreground mb-2">Week 1-2</div>
                <p className="text-main-foreground font-medium text-sm">Individual games, building comfort</p>
              </div>
              <div className="bg-chart-3 border-4 border-border shadow-brutal-xl p-4 text-center">
                <div className="text-2xl font-bold text-main-foreground mb-2">Week 3-4</div>
                <p className="text-main-foreground font-medium text-sm">First collaborative sessions</p>
              </div>
              <div className="bg-chart-5 border-4 border-border shadow-brutal-xl p-4 text-center">
                <div className="text-2xl font-bold text-main-foreground mb-2">Week 5+</div>
                <p className="text-main-foreground font-medium text-sm">Leading group activities</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">Real-World Impact</h2>
            <p className="text-gray-700 font-medium mb-6">
              The skills Emma developed through BrainBerry started showing up in her daily life. 
              Her teacher noticed she was participating more in class discussions. She made her 
              first friend at school in over a year.
            </p>
            
            <div className="bg-chart-1 border-4 border-border shadow-brutal-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-main-foreground mb-4">What Emma Gained:</h3>
              <ul className="space-y-2 text-main-foreground font-medium">
                <li>• Confidence in social interactions</li>
                <li>• Better emotional recognition skills</li>
                <li>• Improved problem-solving abilities</li>
                <li>• A genuine love for collaborative learning</li>
              </ul>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">Advice for Other Parents</h2>
            <p className="text-gray-700 font-medium mb-6">
              If your child is struggling with social challenges, don't underestimate the power 
              of therapeutic gaming. The key is finding something that connects with their interests 
              while building the skills they need.
            </p>
            
            <div className="bg-white border-l-4 border-chart-3 pl-6 mb-8">
              <h4 className="font-bold text-black mb-2">Be Patient</h4>
              <p className="text-gray-700 font-medium mb-4">
                Progress takes time. Emma's breakthrough came after several weeks of consistent play.
              </p>
              
              <h4 className="font-bold text-black mb-2">Celebrate Small Wins</h4>
              <p className="text-gray-700 font-medium mb-4">
                Every completed game, every moment of engagement is progress worth celebrating.
              </p>
              
              <h4 className="font-bold text-black mb-2">Stay Connected</h4>
              <p className="text-gray-700 font-medium">
                Work with your child's therapist to integrate gaming progress with overall treatment goals.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-chart-2 border-4 border-border shadow-brutal-xl p-8 mt-12">
          <div className="text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-main-foreground" />
            <h3 className="text-2xl font-bold text-main-foreground mb-4">
              Emma's story is just one of many
            </h3>
            <p className="text-main-foreground font-medium mb-6">
              Every child's journey is unique, but with the right tools and support, 
              breakthrough moments are possible for everyone.
            </p>
            <Link href="/login" className="bg-white text-black px-8 py-4 border-4 border-border shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-lg inline-block">
              START YOUR CHILD'S JOURNEY
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-black mb-8">More Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "How Gaming Helped Marcus with ADHD Focus",
                author: "Parent Community",
                category: "Success Stories"
              },
              {
                title: "Building Confidence in Non-Verbal Children",
                author: "Dr. Lisa Thompson",
                category: "Expert Insights"
              }
            ].map((article, i) => (
              <div key={i} className="bg-white border-4 border-border shadow-brutal-xl p-6">
                <span className="bg-chart-4 text-main-foreground px-3 py-1 border-2 border-border text-sm font-bold">
                  {article.category}
                </span>
                <h3 className="text-lg font-bold text-black mt-3 mb-2">{article.title}</h3>
                <p className="text-gray-600 font-medium text-sm mb-4">by {article.author}</p>
                <button className="bg-main text-main-foreground px-4 py-2 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm">
                  READ MORE
                </button>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
