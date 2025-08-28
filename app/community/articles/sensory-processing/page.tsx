"use client"

import type React from "react"
import { Calendar, User, ArrowLeft, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function SensoryProcessingArticle() {
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
          <div className="bg-chart-2 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-6 transform -rotate-1">
            <span className="text-main-foreground font-bold">EXPERT INSIGHTS</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            Understanding Sensory Processing in Therapeutic Gaming
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600 font-medium mb-8">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Dr. Sarah Martinez, Occupational Therapist</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>August 25, 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>8 min read</span>
            </div>
          </div>
          
          <div className="bg-black border-4 border-border shadow-brutal-xl overflow-hidden mb-8">
            <Image
              src="/placeholder-uz0c2.png"
              alt="Children engaged in sensory therapeutic gaming"
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
              Sensory processing challenges affect how children receive and respond to sensory information. 
              Through carefully designed therapeutic games, we can help children develop better sensory 
              integration skills while having fun.
            </p>
            
            <h2 className="text-2xl font-bold text-black mb-4">What is Sensory Processing?</h2>
            <p className="text-gray-700 font-medium mb-6">
              Sensory processing is our nervous system's ability to receive sensory information and turn it 
              into appropriate motor and behavioral responses. For many children, especially those who are 
              neurodiverse, this process can be overwhelming or insufficient.
            </p>
            
            <div className="bg-chart-1 border-4 border-border shadow-brutal-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-main-foreground mb-4">Common Sensory Challenges:</h3>
              <ul className="space-y-2 text-main-foreground font-medium">
                <li>• Over-responsiveness to touch, sound, or visual stimuli</li>
                <li>• Under-responsiveness requiring more intense input</li>
                <li>• Difficulty with sensory discrimination</li>
                <li>• Challenges with sensory modulation</li>
              </ul>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">How Gaming Helps</h2>
            <p className="text-gray-700 font-medium mb-6">
              Therapeutic gaming provides a controlled environment where children can gradually expose 
              themselves to different sensory experiences. The interactive nature of games allows for 
              immediate feedback and adjustment of sensory input.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-chart-3 border-4 border-border shadow-brutal-xl p-6">
                <h4 className="text-lg font-bold text-main-foreground mb-3">Visual Processing</h4>
                <p className="text-main-foreground font-medium">
                  Games with adjustable brightness, contrast, and visual complexity help children 
                  build tolerance and discrimination skills.
                </p>
              </div>
              <div className="bg-chart-4 border-4 border-border shadow-brutal-xl p-6">
                <h4 className="text-lg font-bold text-main-foreground mb-3">Auditory Processing</h4>
                <p className="text-main-foreground font-medium">
                  Sound-based games with volume controls and frequency adjustments support 
                  auditory processing development.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">Practical Strategies</h2>
            <p className="text-gray-700 font-medium mb-4">
              When implementing sensory-focused therapeutic games, consider these approaches:
            </p>
            
            <div className="bg-white border-l-4 border-chart-2 pl-6 mb-6">
              <h4 className="font-bold text-black mb-2">Start Small</h4>
              <p className="text-gray-700 font-medium">
                Begin with brief gaming sessions and gradually increase duration as tolerance builds.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-chart-2 pl-6 mb-6">
              <h4 className="font-bold text-black mb-2">Customize Settings</h4>
              <p className="text-gray-700 font-medium">
                Adjust game settings to match the child's current sensory thresholds and preferences.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-chart-2 pl-6 mb-8">
              <h4 className="font-bold text-black mb-2">Monitor Responses</h4>
              <p className="text-gray-700 font-medium">
                Watch for signs of overstimulation and be ready to modify or pause the activity.
              </p>
            </div>
            
            <h2 className="text-2xl font-bold text-black mb-4">Success Stories</h2>
            <p className="text-gray-700 font-medium mb-6">
              In my practice, I've seen remarkable improvements in children who engage with 
              well-designed sensory games. One 7-year-old who was hypersensitive to sound 
              gradually built tolerance through games with adjustable audio features.
            </p>
            
            <div className="bg-chart-5 border-4 border-border shadow-brutal-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-main-foreground mb-4">Key Takeaways</h3>
              <ul className="space-y-2 text-main-foreground font-medium">
                <li>• Therapeutic gaming can be a powerful tool for sensory integration</li>
                <li>• Customization is crucial for individual success</li>
                <li>• Progress happens gradually with consistent practice</li>
                <li>• Professional guidance enhances outcomes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Author Bio */}
        <div className="bg-white border-4 border-border shadow-brutal-xl p-8 mt-12">
          <div className="flex items-start space-x-6">
            <div className="bg-chart-2 w-20 h-20 border-4 border-border flex items-center justify-center">
              <User className="w-10 h-10 text-main-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Dr. Sarah Martinez</h3>
              <p className="text-gray-700 font-medium mb-4">
                Dr. Martinez is a licensed occupational therapist with over 15 years of experience 
                in pediatric sensory processing disorders. She specializes in therapeutic gaming 
                interventions and serves on the BrainBerry advisory board.
              </p>
              <div className="text-sm text-gray-600 font-medium">
                M.S. Occupational Therapy, University of Southern California
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-black mb-8">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Building Executive Function Skills Through Play",
                author: "BrainBerry Team",
                category: "Educational"
              },
              {
                title: "Creating Sensory-Friendly Gaming Spaces",
                author: "Dr. Michael Chen",
                category: "Expert Insights"
              }
            ].map((article, i) => (
              <div key={i} className="bg-white border-4 border-border shadow-brutal-xl p-6">
                <span className="bg-chart-3 text-main-foreground px-3 py-1 border-2 border-border text-sm font-bold">
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
