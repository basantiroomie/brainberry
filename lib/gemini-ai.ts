// Gemini AI Integration for Personalized Game Content Generation
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../utils/logger'

// Initialize Gemini AI
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Generate personalized content using Gemini AI
export async function generatePersonalizedContentWithGemini(
  mold: { structure_type: string; experience_type: string; rules: any; name: string },
  prompt: string,
  targetElements: any
) {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  try {
    // Route to appropriate generator based on mold type
    switch (mold.experience_type) {
      case 'matching':
        return await generateMatchingCardContentWithGemini(model, mold, prompt, targetElements)
      
      case 'sorting':
        return await generateSortingGameContentWithGemini(model, mold, prompt, targetElements)
      
      default:
        console.warn(`Game type '${mold.experience_type}' not yet implemented, falling back to matching cards`)
        return await generateMatchingCardContentWithGemini(model, mold, prompt, targetElements)
    }
  } catch (error) {
    console.error('Gemini AI generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`AI generation failed: ${errorMessage}`)
  }
}

// Generate Matching Card Game content with Gemini AI
async function generateMatchingCardContentWithGemini(model: any, mold: any, prompt: string, targetElements: any) {
  const rules = mold.rules || {}
  const pairsCount = rules.pairs_count || 8

  // Create comprehensive prompt for Gemini
  const geminiPrompt = `You are a creative AI that generates content for children's educational games. Create a personalized matching card memory game based on this child's interests: "${prompt}"

REQUIREMENTS:
- Generate ${pairsCount} unique card pairs for a memory matching game
- Target audience: Children aged 3-12
- Theme should be based on: ${prompt}
- Each card should have a clear, distinct subject
- Content must be child-appropriate, educational, and engaging
- Avoid scary, violent, or inappropriate content

RESPONSE FORMAT (JSON):
{
  "theme": "extracted theme from prompt",
  "age_recommendation": "estimated age range",
  "cards": [
    {
      "pair_id": 1,
      "subject": "specific item name",
      "description": "detailed description for image generation",
      "child_friendly_label": "simple label text",
      "educational_fact": "fun fact about this item",
      "image_prompt": "detailed prompt for AI image generation"
    }
  ],
  "game_settings": {
    "difficulty": "easy/medium/hard",
    "time_limit": 180,
    "success_message": "encouraging completion message",
    "encouragement_phrases": ["phrase1", "phrase2", "phrase3"]
  },
  "educational_value": "what skills this game helps develop"
}`

  logger.info('Sending prompt to Gemini for matching cards', 'GEMINI')
  const result = await model.generateContent(geminiPrompt)
  const response = await result.response
  const text = response.text()

  logger.debug('Gemini response received', 'GEMINI', { 
    responseLength: text.length,
    preview: text.substring(0, 200) 
  })

  // Parse JSON response from Gemini
  let geminiData: any
  try {
    // Extract JSON from response (Gemini might include extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      geminiData = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('No valid JSON found in Gemini response')
    }
  } catch (parseError) {
    logger.error('Failed to parse Gemini JSON', parseError, 'GEMINI')
    logger.debug('Raw Gemini response', 'GEMINI', { rawResponse: text })
    throw new Error('Invalid JSON response from Gemini AI')
  }

  // Transform Gemini response to game format
  // Each card from Gemini represents one unique item/concept
  // We'll create exactly 2 cards for each concept to form pairs
  const transformedCards = (geminiData.cards || []).map((card: any, index: number) => ({
    pair_id: index + 1, // Each concept gets its own pair_id (1, 2, 3, etc.)
    image_url: `/api/generate-image?prompt=${encodeURIComponent(card.image_prompt)}&style=child_friendly&theme=${encodeURIComponent(geminiData.theme)}`,
    label: card.child_friendly_label || card.subject || `${geminiData.theme} item ${index + 1}`,
    description: card.description,
    educational_fact: card.educational_fact,
    ai_generation: {
      image_prompt: card.image_prompt || `${geminiData.theme} item ${index + 1}, cute, colorful, child friendly`,
      subject: card.subject || `${geminiData.theme} item ${index + 1}`,
      fallback_emoji: getThemeEmoji(geminiData.theme, index),
      gemini_generated: true
    }
  }))

  // Enforce fixed number of pairs from mold rules
  let cards = transformedCards.slice(0, pairsCount)
  if (cards.length < pairsCount) {
    const toAdd = pairsCount - cards.length
    for (let i = 0; i < toAdd; i++) {
      const idx = cards.length + 1
      const fillerPrompt = `${geminiData.theme} item ${idx}, cute, colorful, child friendly`
      cards.push({
        pair_id: idx,
        image_url: `/api/generate-image?prompt=${encodeURIComponent(fillerPrompt)}&style=child_friendly&theme=${encodeURIComponent(geminiData.theme)}`,
        label: `${geminiData.theme} ${idx}`,
        description: undefined,
        educational_fact: undefined,
        ai_generation: {
          image_prompt: fillerPrompt,
          subject: `${geminiData.theme} ${idx}`,
          fallback_emoji: getThemeEmoji(geminiData.theme, idx - 1),
          gemini_generated: true
        }
      })
    }
  }

  return {
    game_type: 'matching_cards',
    theme: geminiData.theme,
    personalized_prompt: prompt,
    cards,
    grid_size: rules.grid_size || '4x4',
    time_limit: geminiData.game_settings?.time_limit || 180,
    difficulty: geminiData.game_settings?.difficulty || 'medium',
    background_music: `/assets/themes/${geminiData.theme}/bg-music.mp3`,
    success_sounds: {
      match: `/assets/themes/${geminiData.theme}/match-sound.mp3`,
      victory: `/assets/themes/${geminiData.theme}/victory-sound.mp3`,
      flip: `/assets/themes/${geminiData.theme}/flip-sound.mp3`
    },
    ui_customization: {
      primary_color: getThemeColor(geminiData.theme),
      secondary_color: getSecondaryColor(geminiData.theme),
      success_message: geminiData.game_settings?.success_message || `Amazing! You matched all the ${geminiData.theme}!`,
      encouragement_messages: geminiData.game_settings?.encouragement_phrases || [
        `Great job with ${geminiData.theme}!`,
        `You're getting really good at this!`,
        `Keep going, champion!`
      ]
    },
    educational_metadata: {
      educational_value: geminiData.educational_value,
      age_recommendation: geminiData.age_recommendation,
      skills_developed: ["visual memory", "pattern recognition", "concentration", "vocabulary"],
      generated_at: new Date().toISOString(),
      ai_provider: 'gemini-2.0-flash',
      theme_analysis: geminiData.theme
    }
  }
}

// Generate Sorting Game content with Gemini AI
async function generateSortingGameContentWithGemini(model: any, mold: any, prompt: string, targetElements: any) {
  const geminiPrompt = `Create a personalized sorting/categorization game for children based on: "${prompt}"

REQUIREMENTS:
- Generate 3-4 categories with 3-4 items each (12-16 total items)
- Target audience: Children aged 3-12
- Theme based on: ${prompt}
- Educational and age-appropriate content
- Clear, logical categorization that makes sense to children

RESPONSE FORMAT (JSON):
{
  "theme": "extracted theme",
  "categories": [
    {
      "name": "category name",
      "description": "what goes in this category",
      "color": "hex color code",
      "items": [
        {
          "name": "item name",
          "description": "item description",
          "image_prompt": "detailed prompt for AI image generation",
          "educational_note": "why this item belongs in this category"
        }
      ]
    }
  ],
  "instructions": "simple instructions for children",
  "success_message": "encouraging completion message",
  "educational_value": "what this game teaches"
}`

  logger.info('Sending prompt to Gemini for sorting game', 'GEMINI')
  const result = await model.generateContent(geminiPrompt)
  const response = await result.response
  const text = response.text()

  // Parse and transform response similar to matching cards
  let geminiData: any
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      geminiData = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('No valid JSON found in Gemini response')
    }
  } catch (parseError) {
    console.error('Failed to parse Gemini JSON for sorting game:', parseError)
    throw new Error('Invalid JSON response from Gemini AI')
  }

  // Transform for sorting game format
  const categories = geminiData.categories.map((cat: any, catIndex: number) => ({
    id: catIndex + 1,
    name: cat.name,
    description: cat.description,
    color: cat.color || getThemeColor(geminiData.theme),
    items: cat.items.map((item: any, itemIndex: number) => ({
      id: `${catIndex + 1}-${itemIndex + 1}`,
      name: item.name,
      category_id: catIndex + 1,
      image_url: `/api/generate-image?prompt=${encodeURIComponent(item.image_prompt)}&style=child_friendly&theme=${encodeURIComponent(geminiData.theme)}`,
      description: item.description,
      educational_note: item.educational_note,
      ai_generation: {
        image_prompt: item.image_prompt,
        fallback_emoji: getItemEmoji(item.name),
        gemini_generated: true
      }
    }))
  }))

  return {
    game_type: 'sorting',
    theme: geminiData.theme,
    personalized_prompt: prompt,
    categories,
    instructions: geminiData.instructions || "Drag each item to the correct category!",
    ui_customization: {
      primary_color: getThemeColor(geminiData.theme),
      success_message: geminiData.success_message || `Perfect sorting! You really know your ${geminiData.theme}!`
    },
    educational_metadata: {
      educational_value: geminiData.educational_value,
      skills_developed: ["categorization", "logical thinking", "fine motor skills", "vocabulary"],
      generated_at: new Date().toISOString(),
      ai_provider: 'gemini-2.0-flash'
    }
  }
}

// Helper functions
function getThemeColor(theme: string): string {
  const colorMap: { [key: string]: string } = {
    'animals': '#4CAF50',
    'family': '#FF9800',
    'toys': '#E91E63',
    'food': '#FFC107',
    'nature': '#8BC34A',
    'vehicles': '#2196F3',
    'colors': '#9C27B0'
  }
  return colorMap[theme.toLowerCase()] || '#3F51B5'
}

function getSecondaryColor(theme: string): string {
  const colorMap: { [key: string]: string } = {
    'animals': '#81C784',
    'family': '#FFB74D',
    'toys': '#F06292',
    'food': '#FFD54F',
    'nature': '#AED581',
    'vehicles': '#64B5F6',
    'colors': '#BA68C8'
  }
  return colorMap[theme.toLowerCase()] || '#7986CB'
}

function getThemeEmoji(theme: string, index: number): string {
  const emojiMap: { [key: string]: string[] } = {
    'animals': ['🐶', '🐱', '🐘', '🦁', '🐼', '🐸', '🦋', '🐠'],
    'family': ['👨', '👩', '👧', '👦', '👴', '👵', '🏠', '❤️'],
    'toys': ['🧸', '🚗', '🎾', '🪀', '🎯', '🎨', '🧩', '🎪'],
    'food': ['🍎', '🍌', '🍪', '🍦', '🥕', '🍞', '🍇', '🌽']
  }
  const emojis = emojiMap[theme.toLowerCase()] || ['🎯', '🌟', '🎨', '🎪', '🎭', '🎪', '🎨', '⭐']
  return emojis[index % emojis.length]
}

function getItemEmoji(itemName: string): string {
  const lowerName = itemName.toLowerCase()
  if (lowerName.includes('cat')) return '🐱'
  if (lowerName.includes('dog')) return '🐶'
  if (lowerName.includes('car')) return '🚗'
  if (lowerName.includes('apple')) return '🍎'
  if (lowerName.includes('ball')) return '⚽'
  return '🎯'
}
