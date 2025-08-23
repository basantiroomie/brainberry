// Real AI Integration Service for Implemented Game Types
// Currently supports: Matching Cards, Sorting Games
// Future: Puzzle, Drawing, Storytelling games

import { GoogleGenAI, GeneratedImage, PersonGeneration } from '@google/genai';

interface AIGenerationConfig {
  provider: 'google-imagen' | 'pollinations' | 'openai' | 'midjourney' | 'stable-diffusion' | 'mock'
  apiKey?: string
  baseURL?: string
}

interface CardGenerationRequest {
  theme: string
  userPrompt: string
  cardCount: number
  childAge: number
  style: 'cartoon' | 'realistic' | 'watercolor' | 'digital-art'
  safetyLevel: 'strict' | 'moderate'
}

interface GeneratedCard {
  id: string
  label: string
  imagePrompt: string
  imageUrl?: string
  fallbackEmoji: string
  generationMetadata: {
    provider: string
    timestamp: string
    prompt: string
    safetyCheck: boolean
  }
}

export class CardMatchingAIService {
  private config: AIGenerationConfig
  private googleAI?: GoogleGenAI

  constructor(config: AIGenerationConfig) {
    this.config = config
    
    // Initialize Google AI if using Imagen
    if (config.provider === 'google-imagen' && config.apiKey) {
      this.googleAI = new GoogleGenAI({ apiKey: config.apiKey });
    }
  }

  async generatePersonalizedCards(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    console.log('🎨 Generating personalized cards:', request)

    try {
      switch (this.config.provider) {
        case 'google-imagen':
          return await this.generateWithGoogleImagen(request)
        case 'pollinations':
          return await this.generateWithPollinations(request)
        case 'openai':
          return await this.generateWithOpenAI(request)
        case 'midjourney':
          return await this.generateWithMidjourney(request)
        case 'stable-diffusion':
          return await this.generateWithStableDiffusion(request)
        default:
          return await this.generateMockCards(request)
      }
    } catch (error) {
      console.error('Primary generation failed, trying fallback:', error)
      
      // Try fallback to Pollinations if Google Imagen fails
      if (this.config.provider === 'google-imagen') {
        console.log('🔄 Falling back to Pollinations...')
        return await this.generateWithPollinations(request)
      }
      
      // Ultimate fallback to mock
      return await this.generateMockCards(request)
    }
  }

  private async generateWithGoogleImagen(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    if (!this.googleAI) {
      throw new Error('Google AI not initialized')
    }

    console.log('🎨 Using Google Imagen for generation')
    
    const cards: GeneratedCard[] = []
    const themes = await this.generateCardThemes(request)
    
    try {
      // Generate images for each theme using Google Imagen
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i]
        const imagePrompt = this.buildImagePrompt(theme, request)
        
        // Call Google Imagen API
        const response = await this.googleAI.models.generateImages({
          model: 'imagen-4.0-generate-001', // Fast model for better performance
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            personGeneration: PersonGeneration.ALLOW_ADULT,
            outputMimeType: 'image/jpeg',
            includeRaiReason: true,
          },
        });

        if (response?.generatedImages && response.generatedImages.length > 0) {
          const generatedImage = response.generatedImages[0];
          
          // Convert base64 to data URL
          let imageUrl: string | undefined;
          if (generatedImage.image?.imageBytes) {
            imageUrl = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
          }

          cards.push({
            id: `imagen_card_${i + 1}`,
            label: theme,
            imagePrompt,
            imageUrl,
            fallbackEmoji: this.getThemeEmoji(request.theme, i),
            generationMetadata: {
              provider: 'google-imagen',
              timestamp: new Date().toISOString(),
              prompt: imagePrompt,
              safetyCheck: !generatedImage.raiFilteredReason
            }
          });
        } else {
          throw new Error(`No image generated for theme: ${theme}`);
        }
      }
      
      return cards;
    } catch (error) {
      console.error('Google Imagen generation failed:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  private async generateWithPollinations(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    console.log('🎨 Using Pollinations for generation')
    
    const cards: GeneratedCard[] = []
    const themes = await this.generateCardThemes(request)
    
    try {
      // Generate images for each theme using Pollinations
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i]
        const imagePrompt = this.buildImagePrompt(theme, request)
        
        // Enhanced Pollinations prompt for better accuracy
        const optimizedPrompt = this.optimizePromptForPollinations(imagePrompt, request)
        const encodedPrompt = encodeURIComponent(optimizedPrompt)
        
        // Use different seeds and model parameters for variety
        const seed = Date.now() + i * 1000
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&model=flux&seed=${seed}&enhance=true&nologo=true`
        
        // Test if the image loads successfully with retry mechanism
        let imageResponse
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            // Create an AbortController for timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            
            imageResponse = await fetch(pollinationsUrl, { 
              method: 'HEAD', // Just check if image exists
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (imageResponse.ok) break
            retryCount++
            
            // Wait a bit before retry
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          } catch (error) {
            retryCount++
          }
        }
        
        if (imageResponse && imageResponse.ok) {
          cards.push({
            id: `pollinations_card_${i + 1}`,
            label: this.extractLabelFromTheme(theme),
            imagePrompt: optimizedPrompt,
            imageUrl: pollinationsUrl,
            fallbackEmoji: this.getThemeEmoji(request.theme, i),
            generationMetadata: {
              provider: 'pollinations',
              timestamp: new Date().toISOString(),
              prompt: optimizedPrompt,
              safetyCheck: true // Pollinations has built-in safety
            }
          });
        } else {
          throw new Error(`Failed to generate image for theme: ${theme} after ${maxRetries} retries`);
        }
      }
      
      return cards;
    } catch (error) {
      console.error('Pollinations generation failed:', error);
      throw error; // Re-throw to trigger further fallback
    }
  }

  private optimizePromptForPollinations(prompt: string, request: CardGenerationRequest): string {
    // Pollinations works better with simpler, more direct prompts
    const { theme, style, childAge } = request
    
    // Extract the main subject from the prompt
    const subject = prompt.split(',')[0].trim()
    
    // Create optimized prompt for Pollinations
    const styleMap = {
      'cartoon': 'cartoon illustration',
      'realistic': 'realistic photo',
      'watercolor': 'watercolor painting',
      'digital-art': 'digital art illustration'
    }
    
    const selectedStyle = styleMap[style] || 'cartoon illustration'
    const ageAppropriate = childAge < 7 ? 'cute simple' : 'detailed beautiful'
    
    return `${ageAppropriate} ${selectedStyle} of ${subject}, child-friendly, bright colors, white background, high quality, educational`
  }

  private extractLabelFromTheme(theme: string): string {
    // Extract a clean label from the theme description
    const words = theme.toLowerCase().split(' ')
    
    // Find the main noun (usually the last significant word before descriptors)
    const stopWords = ['friendly', 'cute', 'beautiful', 'happy', 'soft', 'colorful', 'with', 'in', 'on', 'the', 'a', 'an']
    const meaningfulWords = words.filter(word => !stopWords.includes(word))
    
    // Return the first meaningful word, capitalized
    if (meaningfulWords.length > 0) {
      return meaningfulWords[0].charAt(0).toUpperCase() + meaningfulWords[0].slice(1)
    }
    
    return theme.split(' ')[0].charAt(0).toUpperCase() + theme.split(' ')[0].slice(1)
  }

  private async generateWithOpenAI(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    // Real OpenAI DALL-E integration
    const cards: GeneratedCard[] = []
    
    try {
      // First, generate card themes using GPT
      const themes = await this.generateCardThemes(request)
      
      // Then generate images for each theme using DALL-E
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i]
        
        const imagePrompt = this.buildImagePrompt(theme, request)
        
        // Call DALL-E API (example implementation)
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            style: 'vivid'
          })
        })
        
        const imageData = await imageResponse.json()
        
        cards.push({
          id: `card_${i + 1}`,
          label: theme,
          imagePrompt,
          imageUrl: imageData.data?.[0]?.url,
          fallbackEmoji: this.getThemeEmoji(request.theme, i),
          generationMetadata: {
            provider: 'openai',
            timestamp: new Date().toISOString(),
            prompt: imagePrompt,
            safetyCheck: true
          }
        })
      }
      
      return cards
    } catch (error) {
      console.error('OpenAI generation failed:', error)
      return this.generateMockCards(request)
    }
  }

  private async generateWithMidjourney(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    // Midjourney API integration (via Discord bot or API service)
    console.log('🎨 Using Midjourney for generation (placeholder)')
    
    // For now, return mock cards
    // In real implementation, you'd call Midjourney API
    return this.generateMockCards(request)
  }

  private async generateWithStableDiffusion(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    // Stable Diffusion API integration
    console.log('🎨 Using Stable Diffusion for generation (placeholder)')
    
    // For now, return mock cards
    // In real implementation, you'd call Stability AI API
    return this.generateMockCards(request)
  }

  private async generateMockCards(request: CardGenerationRequest): Promise<GeneratedCard[]> {
    // Enhanced mock generation for development/testing
    console.log('🎭 Using mock generation for development')
    
    const themes = await this.generateCardThemes(request)
    
    return themes.map((theme, index) => ({
      id: `mock_card_${index + 1}`,
      label: theme,
      imagePrompt: this.buildImagePrompt(theme, request),
      imageUrl: `/api/mock-images/${request.theme}/${index + 1}`, // Mock endpoint
      fallbackEmoji: this.getThemeEmoji(request.theme, index),
      generationMetadata: {
        provider: 'mock',
        timestamp: new Date().toISOString(),
        prompt: this.buildImagePrompt(theme, request),
        safetyCheck: true
      }
    }))
  }

  private async generateCardThemes(request: CardGenerationRequest): Promise<string[]> {
    const { theme, userPrompt, cardCount, childAge } = request
    
    // Enhanced theme-based generation with better prompts
    // Focus on educational value and child development
    
    if (theme === 'animals' || userPrompt.toLowerCase().includes('animal')) {
      const animalThemes = [
        'Friendly golden retriever dog sitting happily',
        'Cute orange tabby cat playing with yarn', 
        'Baby elephant splashing in water',
        'Colorful parrot perched on a branch',
        'Happy dolphin jumping in the ocean',
        'Soft white bunny rabbit in grass',
        'Wise brown owl sitting on a tree',
        'Giant panda eating bamboo peacefully',
        'Majestic lion with a gentle expression',
        'Striped zebra running in savanna',
        'Tall giraffe eating leaves from tree',
        'Small hedgehog curled up in leaves'
      ]
      return animalThemes.slice(0, cardCount)
    }
    
    if (theme === 'family' || userPrompt.toLowerCase().includes('family')) {
      const familyThemes = [
        'Loving mother reading a bedtime story',
        'Caring father cooking in the kitchen',
        'Happy older sister helping with homework',
        'Cheerful little brother playing with blocks',
        'Wise grandmother knitting a scarf',
        'Fun grandfather gardening with flowers',
        'Family golden retriever dog wagging tail',
        'Cozy family house with flower garden'
      ]
      return familyThemes.slice(0, cardCount)
    }
    
    if (theme === 'toys' || userPrompt.toLowerCase().includes('toy')) {
      const toyThemes = [
        'Soft brown teddy bear with red bow',
        'Red toy fire truck with ladder',
        'Colorful wooden building blocks stacked',
        'Beautiful princess doll in pink dress',
        'Blue toy airplane with propeller',
        'Rainbow striped bouncy ball',
        'Wooden toy train with passenger cars',
        'Magical white unicorn plushie with horn'
      ]
      return toyThemes.slice(0, cardCount)
    }
    
    if (theme === 'food' || userPrompt.toLowerCase().includes('food')) {
      const foodThemes = [
        'Fresh red apple with green leaf',
        'Ripe yellow banana with spots',
        'Chocolate chip cookie on plate',
        'Strawberry ice cream cone with sprinkles',
        'Orange carrot with green leafy top',
        'Whole grain bread slice with crust',
        'Purple grapes in a bunch',
        'Yellow corn on the cob with kernels'
      ]
      return foodThemes.slice(0, cardCount)
    }
    
    if (theme === 'transportation' || userPrompt.toLowerCase().includes('transport|vehicle|car|train')) {
      const transportThemes = [
        'Red school bus with yellow windows',
        'Blue passenger car with four wheels',
        'Yellow taxi cab with checkered pattern',
        'Green bicycle with training wheels',
        'Orange fire truck with ladder',
        'Purple airplane flying in sky',
        'Pink hot air balloon floating',
        'White sailboat on calm water'
      ]
      return transportThemes.slice(0, cardCount)
    }
    
    // Default intelligent themes based on user prompt
    const promptWords = userPrompt.toLowerCase().split(' ')
    const intelligentThemes = []
    
    for (let i = 0; i < cardCount; i++) {
      if (promptWords.includes('nature')) {
        intelligentThemes.push(`Beautiful ${theme} in nature setting - item ${i + 1}`)
      } else if (promptWords.includes('learn') || promptWords.includes('education')) {
        intelligentThemes.push(`Educational ${theme} for learning - concept ${i + 1}`)
      } else if (promptWords.includes('fun') || promptWords.includes('play')) {
        intelligentThemes.push(`Fun and playful ${theme} - activity ${i + 1}`)
      } else {
        intelligentThemes.push(`Child-friendly ${theme} item ${i + 1}`)
      }
    }
    
    return intelligentThemes
  }

  private buildImagePrompt(theme: string, request: CardGenerationRequest): string {
    const { style, childAge, safetyLevel } = request
    
    // Build comprehensive, optimized prompt for better image generation
    const ageAppropriate = childAge < 4 ? 'toddler-friendly' : 
                          childAge < 7 ? 'preschool-friendly' : 
                          childAge < 10 ? 'child-friendly' : 'kid-friendly'
    
    const basePrompt = `${theme}`
    const styleGuide = this.getEnhancedStyleGuide(style, childAge)
    const safetyGuide = safetyLevel === 'strict' 
      ? 'completely safe for children, no scary elements, no sharp objects, gentle expressions only'
      : 'child-appropriate, safe content, friendly appearance'
    
    const qualityGuide = 'high resolution, clear details, professional illustration, well-lit, vibrant but not overwhelming colors'
    const purposeGuide = `perfect for educational memory card game, ${ageAppropriate}, engaging for children aged ${childAge}`
    
    // Combine all elements for optimal prompt
    return `${basePrompt}, ${styleGuide}, ${safetyGuide}, ${qualityGuide}, ${purposeGuide}, isolated on white background, centered composition`
  }

  private getEnhancedStyleGuide(style: string, childAge: number): string {
    const ageModifier = childAge < 4 ? 'very simple and bold' : 
                       childAge < 7 ? 'simple and colorful' : 
                       'detailed but clear'
    
    const guides = {
      cartoon: `${ageModifier} cartoon illustration style, rounded soft shapes, friendly expressions, bright cheerful colors, Disney-Pixar quality, smooth gradients, no harsh lines`,
      realistic: `${ageModifier} photorealistic style but child-friendly, soft natural lighting, warm inviting colors, high quality photography, clean background`,
      watercolor: `${ageModifier} soft watercolor painting style, gentle brush strokes, pastel colors, artistic but clear, traditional art medium, paper texture`,
      'digital-art': `${ageModifier} clean digital art style, smooth vector-like appearance, vibrant but harmonious colors, modern illustration, crisp edges`
    }
    
    return guides[style as keyof typeof guides] || guides.cartoon
  }

  private getThemeEmoji(theme: string, index: number): string {
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

  async validateContentSafety(imageUrl: string, prompt: string): Promise<boolean> {
    // In real implementation, use content moderation APIs
    // For now, return true (assume safe)
    console.log('🛡️ Content safety check for:', prompt)
    return true
  }
}

// Export the service instance
export const aiService = new CardMatchingAIService({
  provider: process.env.NODE_ENV === 'production' ? 'google-imagen' : 'google-imagen', // Use Imagen in all environments
  apiKey: process.env.GEMINI_API_KEY // Use GEMINI_API_KEY for Google services
})

// Usage example:
// const cards = await aiService.generatePersonalizedCards({
//   theme: 'animals',
//   userPrompt: 'My favorite pets like dogs and cats',
//   cardCount: 8,
//   childAge: 6,
//   style: 'cartoon',
//   safetyLevel: 'strict'
// })
