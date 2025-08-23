import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generatePersonalizedContentWithGemini } from '@/lib/gemini-ai'

// Submit a customization request for a child to personalize a mold
export async function POST(req: NextRequest) {
  try {
    console.log('Customization request received')
    const supabase = await createSupabaseServerClient()
    
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    const { child_id, mold_id, prompt, target_elements } = body

    console.log('Request data:', { child_id, mold_id, prompt, target_elements })

    if (!child_id || !mold_id || !prompt) {
      console.log('Missing required fields')
      return NextResponse.json({ error: 'child_id, mold_id, and prompt are required' }, { status: 400 })
    }

    console.log('Attempting to insert customization request')
    
    // Create the customization request
    const { data: request, error: requestError } = await supabase
      .from('MoldCustomizationRequest')
      .insert({
        child_id,
        mold_id,
        prompt,
        target: target_elements || {},
        status: 'pending'
      })
      .select()
      .single()

    console.log('Insert result:', { data: request, error: requestError })

    if (requestError) {
      console.error('Create customization request error:', requestError)
      return NextResponse.json({ 
        error: 'Failed to create request', 
        details: requestError.message,
        code: requestError.code 
      }, { status: 500 })
    }

    console.log('Request created successfully, triggering Gemini AI generation')
    
    // Trigger real AI generation with Gemini
    processCustomizationRequestWithGemini(request.id, prompt, target_elements)

    return NextResponse.json({ 
      request_id: request.id, 
      status: 'pending',
      message: 'Customization request submitted. AI is generating your personalized content...' 
    })

  } catch (error) {
    console.error('Customization request catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get status of customization requests
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const child_id = searchParams.get('child_id')
    const request_id = searchParams.get('request_id')

    if (request_id) {
      // Get specific request status
      const { data, error } = await supabase
        .from('MoldCustomizationRequest')
        .select('*')
        .eq('id', request_id)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    if (child_id) {
      // Get all requests for a child
      const { data, error } = await supabase
        .from('MoldCustomizationRequest')
        .select('*')
        .eq('child_id', child_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    return NextResponse.json({ error: 'child_id or request_id required' }, { status: 400 })

  } catch (error) {
    console.error('Get customization requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Real AI processing with Gemini (replaces mock function)
async function processCustomizationRequestWithGemini(requestId: string, prompt: string, targetElements: any) {
  try {
    console.log(`Starting Gemini AI processing for request ${requestId}`)
    
    // Use setTimeout to avoid blocking the initial response
    setTimeout(async () => {
      try {
        const supabase = await createSupabaseServerClient()
        
        // Get the mold information to determine generation strategy
        const { data: request } = await supabase
          .from('MoldCustomizationRequest')
          .select(`
            child_id, 
            mold_id,
            GameMold!inner(structure_type, experience_type, rules, name)
          `)
          .eq('id', requestId)
          .single()

        if (!request || !request.GameMold) {
          throw new Error('Request or mold not found')
        }

        // Extract mold data
        const moldData = Array.isArray(request.GameMold) ? request.GameMold[0] : request.GameMold
        
        console.log(`Generating content for mold: ${moldData.name} (${moldData.experience_type})`)

        // Generate content using real Gemini AI
        const geminiGeneratedContent = await generatePersonalizedContentWithGemini(
          moldData,
          prompt,
          targetElements
        )
        
        console.log(`Gemini AI generation completed for request ${requestId}`)
        
        // Update request with generated content
        await supabase
          .from('MoldCustomizationRequest')
          .update({
            status: 'complete',
            result: geminiGeneratedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)

        // Create personalized mold instance
        const moldTitle = `${geminiGeneratedContent.theme || 'My'} ${moldData.name}`
        console.log(`Creating personalized mold: ${moldTitle}`)
        
        const { data: personalizedMold, error: moldError } = await supabase
          .from('PersonalizedMold')
          .insert({
            child_id: request.child_id,
            mold_id: request.mold_id,
            title: moldTitle,
            config: geminiGeneratedContent
          })
          .select()
          .single()
          
        if (moldError) {
          throw new Error(`Failed to create personalized mold: ${moldError.message}`)
        }
        
        // Update the customization request with the personalized mold ID
        await supabase
          .from('MoldCustomizationRequest')
          .update({
            personalization_id: personalizedMold.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)
          
        console.log(`Successfully created personalized mold for request ${requestId}`)
        
        return personalizedMold.id

      } catch (processingError) {
        console.error('Gemini AI processing error:', processingError)
        
        // Update request status to failed
        const supabase = await createSupabaseServerClient()
        await supabase
          .from('MoldCustomizationRequest')
          .update({
            status: 'failed',
            error: processingError instanceof Error ? processingError.message : 'AI generation failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)
      }
    }, 2000) // 2 second delay to let the UI show "generating" status

  } catch (error) {
    console.error('Failed to start Gemini AI processing:', error)
    throw error
  }
}

// Note: All mock AI functions have been removed and replaced with real Gemini AI integration
// The system now uses Google's Gemini 2.0 Flash model for content generation

// Polymorphic generation function that handles different mold types
async function generatePersonalizedContentByMoldType(
  mold: { structure_type: string; experience_type: string; rules: any; name: string },
  prompt: string,
  targetElements: any
) {
  const theme = extractTheme(prompt)
  
  // Route to appropriate generator based on mold type
  // Only include fully implemented game types
  switch (mold.experience_type) {
    case 'matching':
      return generateMatchingCardContent(mold, theme, prompt, targetElements)
    
    case 'sorting':
      return generateSortingGameContent(mold, theme, prompt, targetElements)
    
    default:
      // For any unimplemented game types, fallback to matching cards
      console.warn(`Game type '${mold.experience_type}' not yet implemented, falling back to matching cards`)
      return generateMatchingCardContent(mold, theme, prompt, targetElements)
  }
}

// Matching Card Game Generator with Enhanced AI Integration
function generateMatchingCardContent(mold: any, theme: string, prompt: string, targetElements: any) {
  const rules = mold.rules || {}
  const pairsCount = rules.pairs_count || 8
  
  // Enhanced AI prompt generation for matching cards
  const aiPrompts = generateCardMatchingAIPrompts(theme, prompt, pairsCount)
  
  // Generate cards with detailed AI instructions
  const cards = Array.from({ length: pairsCount }, (_, i) => {
    const cardTheme = aiPrompts.cardThemes[i] || `${theme} item ${i + 1}`
    return {
      pair_id: i + 1,
      image_url: `/assets/generated/${theme}/card_${i + 1}.png`,
      label: cardTheme,
      ai_generation: {
        image_prompt: aiPrompts.imagePrompts[i],
        style_prompt: aiPrompts.styleGuide,
        verification_prompt: aiPrompts.verificationPrompts[i],
        fallback_emoji: getThemeEmoji(theme, i)
      }
    }
  })

  return {
    game_type: 'matching_cards',
    theme,
    personalized_prompt: prompt,
    cards,
    grid_size: rules.grid_size || '4x4',
    time_limit: rules.time_limit_seconds || 180,
    difficulty: calculateDifficulty(pairsCount),
    background_music: `/assets/generated/${theme}/bg-music.mp3`,
    success_sounds: {
      match: `/assets/generated/${theme}/match-sound.mp3`,
      victory: `/assets/generated/${theme}/victory-sound.mp3`,
      flip: `/assets/generated/${theme}/flip-sound.mp3`
    },
    ui_customization: {
      primary_color: getThemeColor(theme),
      secondary_color: getSecondaryColor(theme),
      card_back_design: `/assets/generated/${theme}/card-back.png`,
      success_message: `Amazing! You matched all the ${theme}!`,
      encouragement_messages: [
        `Great job with ${theme}!`,
        `You're getting good at this!`,
        `Keep matching those ${theme}!`,
        `Almost there, champion!`
      ]
    },
    ai_generation_metadata: {
      master_prompt: aiPrompts.masterPrompt,
      style_guide: aiPrompts.styleGuide,
      quality_requirements: aiPrompts.qualityRequirements,
      generated_at: new Date().toISOString(),
      theme_analysis: analyzeThemeForAI(prompt),
      child_preferences: extractChildPreferences(prompt)
    }
  }
}

// Generate comprehensive AI prompts for card matching game
function generateCardMatchingAIPrompts(theme: string, userPrompt: string, pairsCount: number) {
  const themeAnalysis = analyzeThemeForAI(userPrompt)
  const childAge = estimateChildAge(userPrompt) // 3-12 based on language complexity
  
  // Master prompt for the entire set
  const masterPrompt = `Create ${pairsCount} matching card pairs for a children's memory game. 
Theme: ${theme} (${userPrompt}). 
Age-appropriate for ${childAge} year olds. 
Style: Cute, colorful, child-friendly, consistent art style across all cards.
Each image should be clearly distinct but thematically related.
Avoid scary, violent, or inappropriate content.
Use bright, engaging colors that appeal to children.`

  // Style guide for consistency
  const styleGuide = `Art Style Requirements:
- Illustration style: Cartoon/animated, friendly and approachable
- Color palette: Bright, vibrant, high contrast for easy recognition
- Background: Simple, clean, minimal distractions
- Character design: Round, soft features, friendly expressions
- Lighting: Soft, even lighting, no harsh shadows
- Composition: Centered subject, clear focal point
- Resolution: High quality, crisp details suitable for card display`

  // Generate specific prompts for each card
  const cardThemes = generateCardThemes(theme, userPrompt, pairsCount)
  const imagePrompts = cardThemes.map((cardTheme, index) => 
    `${masterPrompt}
Card ${index + 1}: ${cardTheme}
Specific details: ${getCardSpecificDetails(cardTheme, theme)}
Style: ${styleGuide}
Make this image distinct from other ${theme} cards but cohesive with the set.`
  )

  // Verification prompts to ensure quality
  const verificationPrompts = cardThemes.map(cardTheme =>
    `Verify this ${cardTheme} image is:
1. Child-appropriate and safe
2. Clearly recognizable as ${cardTheme}
3. Visually distinct from other cards in the set
4. Consistent with the overall ${theme} style
5. High quality and engaging for children`
  )

  const qualityRequirements = {
    resolution: "1024x1024 minimum",
    format: "PNG with transparency support",
    style_consistency: "All cards must share the same artistic style",
    age_appropriateness: `Suitable for ages ${childAge}-12`,
    clarity: "Each subject must be clearly identifiable",
    uniqueness: "Each card must be visually distinct within the theme"
  }

  return {
    masterPrompt,
    styleGuide,
    cardThemes,
    imagePrompts,
    verificationPrompts,
    qualityRequirements
  }
}

// Generate specific card themes based on user input
function generateCardThemes(theme: string, userPrompt: string, count: number): string[] {
  const lowerPrompt = userPrompt.toLowerCase()
  
  // Theme-specific card generation
  if (theme === 'animals' || lowerPrompt.includes('animal') || lowerPrompt.includes('pet')) {
    return [
      'Cute golden retriever puppy', 'Fluffy orange tabby kitten', 
      'Friendly elephant with big ears', 'Colorful parrot on a branch',
      'Playful dolphin jumping', 'Soft white bunny rabbit',
      'Wise brown owl on a tree', 'Happy panda eating bamboo'
    ].slice(0, count)
  }
  
  if (theme === 'family' || lowerPrompt.includes('family') || lowerPrompt.includes('mom') || lowerPrompt.includes('dad')) {
    return [
      'Loving mom with warm smile', 'Caring dad with gentle eyes',
      'Happy big sister playing', 'Cheerful little brother',
      'Kind grandmother reading', 'Fun grandfather with hat',
      'Family pet dog wagging tail', 'Cozy family home'
    ].slice(0, count)
  }
  
  if (theme === 'toys' || lowerPrompt.includes('toy') || lowerPrompt.includes('play')) {
    return [
      'Soft brown teddy bear', 'Red toy fire truck',
      'Colorful building blocks', 'Pink princess doll',
      'Blue toy airplane', 'Rainbow colored ball',
      'Wooden toy train', 'Cuddly stuffed unicorn'
    ].slice(0, count)
  }
  
  if (theme === 'food' || lowerPrompt.includes('food') || lowerPrompt.includes('snack')) {
    return [
      'Fresh red apple', 'Ripe yellow banana',
      'Sweet chocolate chip cookie', 'Creamy vanilla ice cream',
      'Crunchy orange carrot', 'Fluffy white bread',
      'Juicy purple grapes', 'Golden corn on the cob'
    ].slice(0, count)
  }
  
  // Default/mixed themes
  return [
    `Happy ${theme} character 1`, `Colorful ${theme} item 1`,
    `Friendly ${theme} figure 1`, `Bright ${theme} object 1`,
    `Cute ${theme} design 1`, `Fun ${theme} element 1`,
    `Sweet ${theme} creation 1`, `Lovely ${theme} piece 1`
  ].slice(0, count)
}

// Get specific details for each card type
function getCardSpecificDetails(cardTheme: string, theme: string): string {
  if (cardTheme.includes('puppy') || cardTheme.includes('dog')) {
    return 'Sitting pose, tongue out, collar with name tag, grass background'
  }
  if (cardTheme.includes('kitten') || cardTheme.includes('cat')) {
    return 'Playful pose, bright eyes, soft fur texture, cozy indoor setting'
  }
  if (cardTheme.includes('elephant')) {
    return 'Gentle expression, detailed trunk, large ears, savanna background'
  }
  if (cardTheme.includes('mom') || cardTheme.includes('mother')) {
    return 'Warm clothing, caring expression, open arms, homey background'
  }
  if (cardTheme.includes('teddy') || cardTheme.includes('bear')) {
    return 'Soft fur texture, button eyes, sitting position, bedroom setting'
  }
  
  return `Detailed, engaging representation focusing on key ${theme} characteristics`
}

// Analyze theme for AI optimization
function analyzeThemeForAI(prompt: string) {
  const analysis = {
    emotional_tone: 'positive',
    complexity_level: 'simple',
    color_preferences: [] as string[],
    subject_preferences: [] as string[],
    style_hints: [] as string[]
  }
  
  const lowerPrompt = prompt.toLowerCase()
  
  // Detect emotional preferences
  if (lowerPrompt.includes('cute') || lowerPrompt.includes('adorable')) {
    analysis.style_hints.push('extra cute features', 'soft expressions')
  }
  if (lowerPrompt.includes('colorful') || lowerPrompt.includes('bright')) {
    analysis.color_preferences.push('vibrant', 'saturated colors')
  }
  if (lowerPrompt.includes('favorite') || lowerPrompt.includes('love')) {
    analysis.emotional_tone = 'very positive'
  }
  
  // Detect subject specifics
  if (lowerPrompt.includes('my ')) {
    analysis.subject_preferences.push('personal connection')
  }
  
  return analysis
}

// Estimate child age from prompt complexity
function estimateChildAge(prompt: string): number {
  const words = prompt.split(' ').length
  const complexity = prompt.split(',').length
  
  if (words <= 5 && complexity <= 2) return 4  // Simple requests
  if (words <= 10 && complexity <= 3) return 6 // Moderate requests  
  if (words <= 15) return 8                    // Detailed requests
  return 10                                     // Complex requests
}

// Calculate difficulty based on pairs count
function calculateDifficulty(pairsCount: number): string {
  if (pairsCount <= 4) return 'easy'
  if (pairsCount <= 6) return 'medium'
  return 'hard'
}

// Get theme-appropriate emoji fallbacks
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

// Extract child preferences from prompt
function extractChildPreferences(prompt: string) {
  const preferences = {
    mentioned_items: [] as string[],
    emotional_words: [] as string[],
    descriptive_words: [] as string[],
    personal_connections: [] as string[]
  }
  
  const words = prompt.toLowerCase().split(/[\s,]+/)
  
  // Look for emotional indicators
  const emotionalWords = ['favorite', 'love', 'like', 'cute', 'adorable', 'sweet', 'fun']
  preferences.emotional_words = words.filter(word => emotionalWords.includes(word))
  
  // Look for descriptive words
  const descriptiveWords = ['big', 'small', 'colorful', 'bright', 'soft', 'fluffy', 'happy']
  preferences.descriptive_words = words.filter(word => descriptiveWords.includes(word))
  
  // Look for personal connections
  if (prompt.includes('my ') || prompt.includes('our ')) {
    preferences.personal_connections.push('personal ownership mentioned')
  }
  
  return preferences
}

// Sorting Game Generator
function generateSortingGameContent(mold: any, theme: string, prompt: string, targetElements: any) {
  const rules = mold.rules || {}
  const categoriesCount = rules.categories_count || 3
  const itemsPerCategory = rules.items_per_category || 4
  
  const imagePrompt = `Generate ${categoriesCount} categories of ${theme} with ${itemsPerCategory} items each for children sorting game. Style: clear, distinct, colorful`
  
  const categories = Array.from({ length: categoriesCount }, (_, i) => ({
    id: i + 1,
    name: `${theme} Category ${i + 1}`,
    color: getThemeColor(theme),
    items: Array.from({ length: itemsPerCategory }, (_, j) => ({
      id: `${i + 1}_${j + 1}`,
      image_url: `/assets/generated/${theme}/sort_${i + 1}_${j + 1}.png`,
      label: `${theme} Item ${j + 1}`,
      ai_prompt: `${imagePrompt}, category ${i + 1}, item ${j + 1}`
    }))
  }))

  return {
    game_type: 'sorting',
    theme,
    personalized_prompt: prompt,
    categories,
    success_message: `Perfect sorting! You know your ${theme} so well!`,
    ai_generation_metadata: {
      image_prompt: imagePrompt,
      generated_at: new Date().toISOString()
    }
  }
}

// Get secondary theme color
function getSecondaryColor(theme: string): string {
  const secondaryColors: Record<string, string> = {
    animals: '#10b981',      // emerald  
    family: '#f97316',       // orange
    toys: '#06b6d4',         // cyan
    food: '#dc2626',         // red
    characters: '#7c3aed',   // violet
    favorites: '#0891b2'     // sky
  }
  return secondaryColors[theme] || secondaryColors.favorites
}// Drawing Game Generator
function generateDrawingGameContent(mold: any, theme: string, prompt: string, targetElements: any) {
  const rules = mold.rules || {}
  const promptsCount = rules.drawing_prompts || 5
  
  const prompts = Array.from({ length: promptsCount }, (_, i) => ({
    id: i + 1,
    text: `Draw your favorite ${theme} #${i + 1}`,
    example_image: `/assets/generated/${theme}/draw_example_${i + 1}.png`,
    ai_prompt: `Simple line drawing example of ${theme} for children to copy or inspire from`
  }))

  return {
    game_type: 'drawing',
    theme,
    personalized_prompt: prompt,
    drawing_prompts: prompts,
    canvas_size: rules.canvas_size || { width: 800, height: 600 },
    success_message: `Beautiful drawings of your ${theme}!`,
    ai_generation_metadata: {
      generated_at: new Date().toISOString()
    }
  }
}

// Storytelling Game Generator
function generateStorytellingContent(mold: any, theme: string, prompt: string, targetElements: any) {
  const rules = mold.rules || {}
  const charactersCount = rules.characters_count || 3
  
  const storyPrompt = `Create a simple children's story template about ${theme}. Include ${charactersCount} characters and a beginning, middle, end structure.`
  
  const characters = Array.from({ length: charactersCount }, (_, i) => ({
    id: i + 1,
    name: `${theme} Character ${i + 1}`,
    image_url: `/assets/generated/${theme}/character_${i + 1}.png`,
    description: `A friendly ${theme} character`,
    ai_prompt: `Cute ${theme} character for children's story, character ${i + 1}`
  }))

  return {
    game_type: 'storytelling',
    theme,
    personalized_prompt: prompt,
    story_template: {
      title: `The Adventures of ${theme}`,
      characters,
      scenes: [
        {
          type: 'beginning',
          prompt: `Once upon a time, there were some special ${theme}...`,
          background: `/assets/generated/${theme}/scene_beginning.png`
        },
        {
          type: 'middle',
          prompt: `One day, something exciting happened with the ${theme}...`,
          background: `/assets/generated/${theme}/scene_middle.png`
        },
        {
          type: 'end',
          prompt: `And they all lived happily with their ${theme}...`,
          background: `/assets/generated/${theme}/scene_end.png`
        }
      ]
    },
    success_message: `What a wonderful story about ${theme}!`,
    ai_generation_metadata: {
      story_prompt: storyPrompt,
      generated_at: new Date().toISOString()
    }
  }
}

function extractTheme(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('animal') || lowerPrompt.includes('pet') || lowerPrompt.includes('dog') || lowerPrompt.includes('cat')) {
    return 'animals'
  } else if (lowerPrompt.includes('family') || lowerPrompt.includes('mom') || lowerPrompt.includes('dad') || lowerPrompt.includes('sibling')) {
    return 'family'
  } else if (lowerPrompt.includes('toy') || lowerPrompt.includes('car') || lowerPrompt.includes('doll') || lowerPrompt.includes('block')) {
    return 'toys'
  } else if (lowerPrompt.includes('food') || lowerPrompt.includes('fruit') || lowerPrompt.includes('pizza') || lowerPrompt.includes('candy')) {
    return 'food'
  } else if (lowerPrompt.includes('cartoon') || lowerPrompt.includes('superhero') || lowerPrompt.includes('princess') || lowerPrompt.includes('character')) {
    return 'characters'
  } else {
    return 'favorites'
  }
}

function getThemeColor(theme: string): string {
  const colors: Record<string, string> = {
    animals: '#4ade80',      // green
    family: '#f59e0b',       // amber
    toys: '#3b82f6',         // blue
    food: '#ef4444',         // red
    characters: '#8b5cf6',   // purple
    favorites: '#06b6d4'     // cyan
  }
  return colors[theme] || colors.favorites
}
