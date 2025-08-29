"use client"

import type React from "react"
import { Heart, Users, BookOpen, Calendar, ArrowRight, MessageCircle, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"


export default function CommunityPage() {
      const router = useRouter()
    
      const goToLogin = () => {
        router.push("/login")
      }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">BRAINBERRY COMMUNITY</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/community" className="text-black hover:text-main font-medium">
                Community
              </a>
              <button
                onClick={goToLogin}
                className="bg-main text-main-foreground px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
              >
                JOIN NOW
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-chart-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white border-4 border-border shadow-brutal-3xl p-8 transform -rotate-1 inline-block mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-4">COMMUNITY HUB</h1>
            <p className="text-xl text-gray-700 font-medium">
              Where families, educators, and experts come together
            </p>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-chart-2 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-12 transform rotate-1">
            <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">FEATURED STORIES</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Understanding Sensory Processing",
                excerpt: "A comprehensive guide to helping children with sensory challenges through therapeutic gaming.",
                author: "Dr. Sarah Martinez",
                date: "Aug 25, 2025",
                category: "Expert Insights",
                image: "/Understanding_sensory_processing.png",
                readTime: "8 min read"
              },
              {
                title: "Emma's First Breakthrough",
                excerpt: "How personalized games helped Emma overcome social anxiety and build confidence.",
                author: "Jennifer K. (Parent)",
                date: "Aug 23, 2025",
                category: "Success Stories",
                image: "/Emma_first.png",
                readTime: "5 min read"
              },
              {
                title: "Building Executive Function Skills",
                excerpt: "Research-backed strategies for developing working memory and attention through play.",
                author: "BrainBerry Team",
                date: "Aug 20, 2025",
                category: "Educational",
                image: "/Building_executive_function_skills.png",
                readTime: "12 min read"
              }
            ].map((article, i) => (
              <article key={i} className="bg-white border-4 border-border shadow-brutal-xl hover:shadow-[20px_20px_0px_0px_var(--color-border)] transition-all duration-300">
                <div className="bg-black h-48 border-b-4 border-border overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    width={400}
                    height={200}
                    className={`w-full h-full ${i === 2 ? 'object-cover object-top' : 'object-cover'}`}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-chart-3 text-main-foreground px-3 py-1 border-2 border-border text-sm font-bold">
                      {article.category}
                    </span>
                    <span className="text-gray-600 text-sm font-medium">{article.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">{article.title}</h3>
                  <p className="text-gray-700 font-medium mb-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 font-medium">
                      <p>{article.author}</p>
                      <p>{article.date}</p>
                    </div>
                    <button className="bg-main text-main-foreground px-4 py-2 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm">
                      <Link href={`/community/articles/${i === 0 ? 'sensory-processing' : i === 1 ? 'emma-breakthrough' : 'executive-function'}`}>
                        READ MORE
                      </Link>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-20 bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="bg-chart-4 border-4 border-border shadow-brutal-colored-xl p-4 inline-block transform -rotate-1">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">OUR GROWING COMMUNITY</h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { number: "2,500+", label: "FAMILIES", icon: Heart },
              { number: "150+", label: "EDUCATORS", icon: BookOpen },
              { number: "5,000+", label: "GAMES PLAYED", icon: Users },
              { number: "98%", label: "SUCCESS RATE", icon: Star }
            ].map((stat, i) => (
              <div key={i} className="bg-white border-4 border-border shadow-brutal-xl p-6 text-center transform hover:scale-105 transition-transform">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-chart-2" />
                <div className="text-3xl font-bold text-black mb-2">{stat.number}</div>
                <div className="text-gray-700 font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-chart-5 border-4 border-border shadow-brutal-colored p-4 inline-block mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">EXPLORE TOPICS</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "PARENT GUIDES",
                description: "Tips and strategies for supporting your child's learning journey",
                count: "24 articles",
                color: "bg-chart-1"
              },
              {
                title: "SUCCESS STORIES",
                description: "Real families sharing their BrainBerry experiences",
                count: "18 stories",
                color: "bg-chart-2"
              },
              {
                title: "EXPERT INSIGHTS",
                description: "Research and advice from child development specialists",
                count: "31 articles",
                color: "bg-chart-3"
              },
              {
                title: "EDUCATOR RESOURCES",
                description: "Tools and techniques for therapeutic gaming in classrooms",
                count: "15 resources",
                color: "bg-chart-4"
              }
            ].map((category, i) => (
              <div key={i} className="bg-white border-4 border-border shadow-brutal-xl hover:shadow-[16px_16px_0px_0px_var(--color-border)] transition-all duration-300 overflow-hidden">
                <div className={`${category.color} border-b-4 border-border p-4`}>
                  <h3 className="text-xl font-bold text-main-foreground">{category.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 font-medium mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">{category.count}</span>
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discussion Forum Preview */}
      <section className="py-20 bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-main border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-12 transform rotate-1">
            <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">COMMUNITY DISCUSSIONS</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Tips for introducing new games to anxious children?",
                author: "Parent_Sarah",
                replies: 12,
                lastActivity: "2 hours ago",
                category: "General Discussion"
              },
              {
                title: "Research on gaming interventions for ADHD",
                author: "Dr.Thompson",
                replies: 8,
                lastActivity: "5 hours ago",
                category: "Expert Corner"
              },
              {
                title: "Celebrating milestones - my son's progress update!",
                author: "ProudMom92",
                replies: 25,
                lastActivity: "1 day ago",
                category: "Success Stories"
              },
              {
                title: "Implementing BrainBerry in special education classrooms",
                author: "Ms.Rodriguez",
                replies: 15,
                lastActivity: "1 day ago",
                category: "Educator Network"
              }
            ].map((discussion, i) => (
              <div key={i} className="bg-white border-4 border-border shadow-brutal-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-chart-2 text-main-foreground px-3 py-1 border-2 border-border text-xs font-bold">
                    {discussion.category}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">{discussion.lastActivity}</span>
                </div>
                <h3 className="text-lg font-bold text-black mb-3">{discussion.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 font-medium">
                    <span>by {discussion.author}</span>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{discussion.replies} replies</span>
                    </div>
                  </div>
                  <button className="bg-main text-main-foreground px-4 py-2 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm">
                    <Link href="/community/discussions">
                      JOIN
                    </Link>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/community/discussions" className="bg-chart-3 text-main-foreground px-8 py-4 border-4 border-border shadow-brutal-2xl hover:shadow-brutal-3xl transition-all font-bold text-lg inline-block">
              VIEW ALL DISCUSSIONS
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-main">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-4 border-border shadow-[28px_28px_0px_0px_var(--color-border)] p-8 transform -rotate-1">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">STAY CONNECTED</h2>
            <p className="text-xl text-gray-700 font-medium mb-8">
              Get weekly updates, new articles, and community highlights delivered to your inbox.
            </p>
            <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-6 py-4 border-4 border-border bg-background text-foreground font-medium text-lg"
              />
              <button className="bg-chart-2 text-main-foreground px-8 py-4 border-4 border-border shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-lg">
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-background border-t-4 border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <Users className="h-8 w-8 text-foreground" />
            <span className="text-xl font-bold text-foreground">BRAINBERRY COMMUNITY</span>
          </Link>
          <p className="text-foreground font-medium">
            Building bridges between families, educators, and therapeutic gaming.
          </p>
        </div>
      </footer>
    </div>
  )
}
