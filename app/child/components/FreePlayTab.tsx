"use client"

import { useState } from "react"
import { Music, Heart, ArrowLeft } from "lucide-react"
import Image from "next/image"
import MusicMaker from "../Games/MusicMaker"
import BreathingBuddy from "../Games/BreathingBuddy"

interface FreePlayTabProps {
  childProfile?: any
}

type ViewMode = 'overview' | 'music' | 'breathing'

export default function FreePlayTab({ childProfile }: FreePlayTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')

  // Render different views based on mode
  if (viewMode === 'music') {
    return <MusicMaker onBack={() => setViewMode('overview')} />
  }
  
  if (viewMode === 'breathing') {
    return <BreathingBuddy onBack={() => setViewMode('overview')} />
  }

  return (
    <div className="space-y-8 p-6">
      <div className="text-center mb-8">
        <div className="inline-block transform -rotate-2 mb-4">
          <div className="bg-chart-4 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-4xl transform hover:rotate-1 transition-transform">
            FREE PLAY
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* Music Maker */}
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Music Image */}
          <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 border-b-4 border-black">
            <Image
              src="/marisa-howenstine-Cq9slNxV8YU-unsplash.jpg"
              alt="Music Maker"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-200 to-pink-200">
              <div className="bg-white rounded-full p-4 border-2 border-black">
                <Music className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            {/* Activity Badge */}
            <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
              <span className="text-sm font-bold text-gray-700">Creative</span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Music Maker</h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Create beautiful melodies with piano keys and drum pads. Make your own musical patterns and play them back!
            </p>
            
            <button 
              onClick={() => setViewMode('music')}
              className="w-full bg-purple-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center"
            >
              <Music className="h-5 w-5 mr-2" />
              START CREATING
            </button>
          </div>
        </div>

        {/* Breathing Buddy */}
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Breathing Image */}
          <div className="relative h-48 bg-gradient-to-br from-green-100 to-blue-100 border-b-4 border-black">
            <Image
              src="/ashton-bingham-SAHBl2UpXco-unsplash.jpg"
              alt="Breathing Buddy"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-200 to-blue-200">
              <div className="bg-white rounded-full p-4 border-2 border-black">
                <Heart className="h-8 w-8 text-green-500" />
              </div>
            </div>
            {/* Activity Badge */}
            <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
              <span className="text-sm font-bold text-gray-700">Wellness</span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Breathing Buddy</h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Learn to relax and calm your mind with guided breathing exercises. Follow the breathing circle and feel peaceful!
            </p>
            
            <button 
              onClick={() => setViewMode('breathing')}
              className="w-full bg-green-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center"
            >
              <Heart className="h-5 w-5 mr-2" />
              START BREATHING
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}
