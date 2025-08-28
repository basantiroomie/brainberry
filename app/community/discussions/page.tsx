"use client"

import type React from "react"
import { MessageCircle, Users, Plus, Search, Filter, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DiscussionsPage() {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="bg-chart-2 border-4 border-border shadow-brutal-3xl p-8 transform -rotate-1 inline-block mb-8">
            <h1 className="flex items-center justify-center space-x-3 text-4xl md:text-6xl font-bold text-main-foreground">
              <MessageCircle className="w-12 h-12" />
              <span>COMMUNITY DISCUSSIONS</span>
            </h1>
          </div>
          <p className="text-xl text-gray-700 font-medium max-w-3xl mx-auto">
            Connect with other families, educators, and experts. Share experiences, ask questions, and learn together.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white border-4 border-border shadow-brutal-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-4">
              <button className="bg-main text-main-foreground px-6 py-3 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>NEW DISCUSSION</span>
              </button>
              <select className="border-2 border-border px-4 py-3 font-bold bg-white">
                <option>All Categories</option>
                <option>General Discussion</option>
                <option>Success Stories</option>
                <option>Expert Corner</option>
                <option>Educator Network</option>
                <option>Technical Support</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search discussions..."
                  className="border-2 border-border pl-10 pr-4 py-3 font-medium w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button className="border-2 border-border p-3 bg-white hover:bg-gray-50">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Discussion Categories */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: "GENERAL DISCUSSION",
              description: "Open conversations about therapeutic gaming",
              count: "124 discussions",
              color: "bg-chart-1"
            },
            {
              title: "SUCCESS STORIES",
              description: "Share your child's breakthrough moments",
              count: "67 stories",
              color: "bg-chart-2"
            },
            {
              title: "EXPERT CORNER",
              description: "Q&A with child development specialists",
              count: "89 topics",
              color: "bg-chart-3"
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
                  <button className="bg-main text-main-foreground px-4 py-2 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm">
                    BROWSE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Discussions */}
        <div className="bg-white border-4 border-border shadow-brutal-xl overflow-hidden">
          <div className="bg-chart-4 border-b-4 border-border p-6">
            <h2 className="text-2xl font-bold text-main-foreground">RECENT DISCUSSIONS</h2>
          </div>
          
          <div className="divide-y-4 divide-border">
            {[
              {
                title: "Tips for introducing new games to anxious children?",
                author: "Parent_Sarah",
                category: "General Discussion",
                replies: 12,
                lastActivity: "2 hours ago",
                isPinned: true,
                hasExpertReply: false
              },
              {
                title: "Research on gaming interventions for ADHD - latest findings",
                author: "Dr.Thompson",
                category: "Expert Corner",
                replies: 8,
                lastActivity: "5 hours ago",
                isPinned: false,
                hasExpertReply: true
              },
              {
                title: "Celebrating milestones - my son's progress update! 🎉",
                author: "ProudMom92",
                category: "Success Stories",
                replies: 25,
                lastActivity: "1 day ago",
                isPinned: false,
                hasExpertReply: false
              },
              {
                title: "Implementing BrainBerry in special education classrooms",
                author: "Ms.Rodriguez",
                category: "Educator Network",
                replies: 15,
                lastActivity: "1 day ago",
                isPinned: false,
                hasExpertReply: true
              },
              {
                title: "How to track progress across multiple children?",
                author: "TherapistJen",
                category: "Technical Support",
                replies: 6,
                lastActivity: "2 days ago",
                isPinned: false,
                hasExpertReply: false
              },
              {
                title: "Sensory considerations for game customization",
                author: "OT_Specialist",
                category: "Expert Corner",
                replies: 18,
                lastActivity: "3 days ago",
                isPinned: false,
                hasExpertReply: true
              }
            ].map((discussion, i) => (
              <div key={i} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {discussion.isPinned && (
                        <span className="bg-chart-5 text-main-foreground px-2 py-1 border border-border text-xs font-bold">
                          PINNED
                        </span>
                      )}
                      <span className="bg-chart-1 text-main-foreground px-3 py-1 border border-border text-xs font-bold">
                        {discussion.category}
                      </span>
                      {discussion.hasExpertReply && (
                        <span className="bg-chart-3 text-main-foreground px-2 py-1 border border-border text-xs font-bold">
                          EXPERT REPLY
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-black mb-2 hover:text-main cursor-pointer">
                      {discussion.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 font-medium">
                      <span>by {discussion.author}</span>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{discussion.replies} replies</span>
                      </div>
                      <span>Last activity: {discussion.lastActivity}</span>
                    </div>
                  </div>
                  <button className="bg-main text-main-foreground px-4 py-2 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm ml-4">
                    VIEW
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="mt-12 bg-white border-4 border-border shadow-brutal-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Community Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-black mb-3">✅ Do</h3>
              <ul className="space-y-2 text-gray-700 font-medium">
                <li>• Be respectful and supportive</li>
                <li>• Share experiences and insights</li>
                <li>• Ask questions and seek help</li>
                <li>• Celebrate others' successes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-black mb-3">❌ Don't</h3>
              <ul className="space-y-2 text-gray-700 font-medium">
                <li>• Share personal information</li>
                <li>• Give medical advice</li>
                <li>• Use inappropriate language</li>
                <li>• Spam or advertise</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
