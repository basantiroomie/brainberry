// AI image generation service for game assets
// Integrates with Gemini AI for content generation and Pollinations AI for image generation
import { logger } from '../utils/logger'
import { generatePersonalizedContentWithGemini } from './gemini-ai'

interface ImageGenerationRequest {
  prompt: string
  style?: 'cartoon' | 'realistic' | 'minimalist'
  aspectRatio?: '1:1' | '16:9' | '4:3'
  quality?: 'draft' | 'standard' | 'high'
}

interface ImageGenerationResponse {
  success: boolean
  imageUrl?: string
  error?: string
  metadata?: {
    prompt: string
    generatedAt: string
    style: string
  }
}

class AIGenerationService {
  private readonly baseUrl: string
  
  constructor() {
    this.baseUrl = 'https://pollinations.ai/p/'
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      logger.info('AI image generation requested', 'AI_SERVICE', { prompt: request.prompt })
      
      // Use Pollinations AI for image generation
      const style = request.style || 'cartoon'
      const enhancedPrompt = `${request.prompt}, ${style} style, child-friendly, educational, high quality`
      const imageUrl = `${this.baseUrl}${encodeURIComponent(enhancedPrompt)}?width=512&height=512&seed=${Date.now()}`
      
      // Test if the URL is accessible
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' })
        if (response.ok) {
          return {
            success: true,
            imageUrl,
            metadata: {
              prompt: request.prompt,
              generatedAt: new Date().toISOString(),
              style: request.style || 'cartoon'
            }
          }
        }
      } catch (fetchError) {
        logger.warn('Pollinations API not accessible, using fallback', 'AI_SERVICE')
      }
      
      // Fallback to placeholder
      return {
        success: true,
        imageUrl: '/placeholder.jpg',
        metadata: {
          prompt: request.prompt,
          generatedAt: new Date().toISOString(),
          style: request.style || 'cartoon'
        }
      }
    } catch (error) {
      logger.error('AI image generation failed', 'AI_SERVICE')
      return {
        success: false,
        error: 'Failed to generate image'
      }
    }
  }

  async generateGameAssets(gameConfig: {
    type?: string
    theme?: string
    style?: string
  }): Promise<{
    cards?: string[]
    backgrounds?: string[]
    characters?: string[]
  }> {
    try {
      logger.info('Generating game assets', 'AI_SERVICE', { gameType: gameConfig.type })
      
      // Generate assets using the image generation method
      const theme = gameConfig.theme || 'general'
      const style = gameConfig.style || 'cartoon'
      
      const assets = {
        cards: [this.generateImageUrl(`${theme} card design`, style)],
        backgrounds: [this.generateImageUrl(`${theme} background scene`, style)],
        characters: [this.generateImageUrl(`${theme} character`, style)]
      }
      
      return assets
    } catch (error) {
      logger.error('Game asset generation failed', 'AI_SERVICE')
      return {
        cards: ['/placeholder.jpg'],
        backgrounds: ['/placeholder.jpg'],
        characters: ['/placeholder.jpg']
      }
    }
  }

  async generatePersonalizedCards(request: {
    theme: string
    userPrompt: string
    cardCount: number
    childAge?: number
    style?: string
    safetyLevel?: string
  }): Promise<Array<{
    id: string
    imageUrl: string
    text: string
    metadata: any
  }>> {
    try {
      logger.info('Generating personalized cards', 'AI_SERVICE', {
        theme: request.theme,
        cardCount: request.cardCount
      })
      
      // Create a mock game mold for Gemini AI
      const mockMold = {
        structure_type: 'card_pairs',
        experience_type: 'matching',
        rules: {
          card_pairs: request.cardCount / 2,
          time_limit: 300,
          difficulty: 'medium'
        },
        name: `${request.theme} Matching Game`
      }

      // Use Gemini AI to generate content
      try {
        const geminiResult = await generatePersonalizedContentWithGemini(
          mockMold,
          request.userPrompt,
          { theme: request.theme, style: request.style || 'cartoon' }
        )

        // Check if result has cards (for matching games)
        if (geminiResult && 'cards' in geminiResult && Array.isArray(geminiResult.cards)) {
          // Convert Gemini result to expected format
          const cards = geminiResult.cards.map((card: any, index: number) => ({
            id: `card-${index + 1}`,
            imageUrl: this.generateImageUrl(card.label || card.text || `${request.theme} item`, request.style),
            text: card.label || card.text || `${request.theme} item ${index + 1}`,
            metadata: {
              theme: request.theme,
              generatedAt: new Date().toISOString(),
              style: request.style || 'cartoon',
              fallbackEmoji: card.ai_generation?.fallback_emoji || '⭐'
            }
          }))

          return cards
        }
      } catch (geminiError) {
        logger.warn('Gemini AI generation failed, using fallback', 'AI_SERVICE')
      }
      
      // Fallback implementation
      const cards = Array.from({ length: request.cardCount }, (_, index) => ({
        id: `card-${index + 1}`,
        imageUrl: this.generateImageUrl(`${request.theme} item ${index + 1}`, request.style),
        text: `${request.theme} item ${index + 1}`,
        metadata: {
          theme: request.theme,
          generatedAt: new Date().toISOString(),
          style: request.style || 'cartoon'
        }
      }))

      return cards
    } catch (error) {
      logger.error('Personalized card generation failed', 'AI_SERVICE')
      // Return minimal fallback
      return Array.from({ length: request.cardCount }, (_, index) => ({
        id: `card-${index + 1}`,
        imageUrl: '/placeholder.jpg',
        text: `${request.theme} card ${index + 1}`,
        metadata: {
          theme: request.theme,
          generatedAt: new Date().toISOString(),
          style: request.style || 'cartoon'
        }
      }))
    }
  }

  private generateImageUrl(prompt: string, style?: string): string {
    const enhancedPrompt = `${prompt}, ${style || 'cartoon'} style, child-friendly, educational, simple background`
    return `${this.baseUrl}${encodeURIComponent(enhancedPrompt)}?width=256&height=256&seed=${Math.floor(Math.random() * 10000)}`
  }

  async validateImageGeneration(prompt: string): Promise<{
    isValid: boolean
    suggestions?: string[]
    warnings?: string[]
  }> {
    try {
      // Basic prompt validation for child safety
      const isValid = prompt.length > 5 && prompt.length < 1000
      const suggestions: string[] = []
      const warnings: string[] = []

      if (prompt.length < 10) {
        suggestions.push('Try providing more descriptive details')
      }

      // Check for inappropriate content
      const inappropriateWords = ['violence', 'scary', 'dangerous', 'weapon']
      const hasInappropriate = inappropriateWords.some(word => 
        prompt.toLowerCase().includes(word)
      )

      if (hasInappropriate) {
        warnings.push('Content may not be suitable for children')
      }

      // Encourage educational content
      if (!prompt.includes('educational') && !prompt.includes('learning')) {
        suggestions.push('Consider adding educational elements')
      }

      return { isValid: isValid && !hasInappropriate, suggestions, warnings }
    } catch (error) {
      logger.error('Prompt validation failed', 'AI_SERVICE')
      return { isValid: false }
    }
  }
}

// Export singleton instance
export const aiService = new AIGenerationService()

// Export types for use in other modules
export type { ImageGenerationRequest, ImageGenerationResponse }
