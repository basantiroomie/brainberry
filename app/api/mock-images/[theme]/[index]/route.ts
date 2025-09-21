import { NextRequest, NextResponse } from 'next/server'

// Mock image generation endpoint for development
// Returns SVG placeholders that look like AI-generated content

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ theme: string; index: string }> }
) {
  const resolvedParams = await params
  const { theme, index } = resolvedParams
  
  const colors = getThemeColors(theme)
  const emoji = getThemeEmoji(theme, parseInt(index) - 1)
  const label = getThemeLabel(theme, parseInt(index))
  
  // Generate SVG placeholder that mimics AI-generated content
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="512" height="512" fill="url(#grad)" rx="24"/>
      
      <!-- Border -->
      <rect x="8" y="8" width="496" height="496" fill="none" stroke="white" stroke-width="4" rx="20" opacity="0.7"/>
      
      <!-- Main emoji/icon -->
      <text x="256" y="280" font-size="120" text-anchor="middle" filter="url(#shadow)">${emoji}</text>
      
      <!-- Label -->
      <text x="256" y="380" font-size="28" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" filter="url(#shadow)">${label}</text>
      
      <!-- AI indicator -->
      <circle cx="450" cy="62" r="20" fill="rgba(255,255,255,0.8)"/>
      <text x="450" y="68" font-size="16" text-anchor="middle" fill="${colors.primary}">AI</text>
      
      <!-- Decorative elements -->
      <circle cx="80" cy="80" r="8" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
      <circle cx="432" cy="432" r="6" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
      <circle cx="60" cy="400" r="4" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function getThemeColors(theme: string) {
  const colorSets: Record<string, { primary: string; secondary: string }> = {
    animals: { primary: '#4ade80', secondary: '#22c55e' },
    family: { primary: '#f59e0b', secondary: '#d97706' },
    toys: { primary: '#3b82f6', secondary: '#1d4ed8' },
    food: { primary: '#ef4444', secondary: '#dc2626' },
    characters: { primary: '#8b5cf6', secondary: '#7c3aed' },
    default: { primary: '#06b6d4', secondary: '#0891b2' }
  }
  
  return colorSets[theme] || colorSets.default
}

function getThemeEmoji(theme: string, index: number): string {
  const emojiSets: Record<string, string[]> = {
    animals: ['🐶', '🐱', '🐘', '🦜', '🐬', '🐰', '🦉', '🐼'],
    family: ['👩', '👨', '👧', '👦', '👵', '👴', '🐕', '🏠'],
    toys: ['🧸', '🚒', '🧱', '👸', '✈️', '⚽', '🚂', '🦄'],
    food: ['🍎', '🍌', '🍪', '🍦', '🥕', '🍞', '🍇', '🌽'],
    characters: ['🦸', '👑', '🧙', '🧚', '🤖', '👻', '🎭', '⭐']
  }
  
  const emojis = emojiSets[theme] || emojiSets.characters
  return emojis[index % emojis.length]
}

function getThemeLabel(theme: string, index: number): string {
  const labelSets: Record<string, string[]> = {
    animals: ['Puppy', 'Kitten', 'Elephant', 'Parrot', 'Dolphin', 'Bunny', 'Owl', 'Panda'],
    family: ['Mom', 'Dad', 'Sister', 'Brother', 'Grandma', 'Grandpa', 'Pet', 'Home'],
    toys: ['Teddy', 'Truck', 'Blocks', 'Doll', 'Plane', 'Ball', 'Train', 'Unicorn'],
    food: ['Apple', 'Banana', 'Cookie', 'Ice Cream', 'Carrot', 'Bread', 'Grapes', 'Corn'],
    characters: ['Hero', 'Princess', 'Wizard', 'Fairy', 'Robot', 'Ghost', 'Actor', 'Star']
  }
  
  const labels = labelSets[theme] || [`Item ${index}`]
  return labels[(index - 1) % labels.length]
}
