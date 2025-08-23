import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-generation-service'

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing Google Imagen integration...')
    
    // Test with a simple child-friendly prompt
    const testRequest = {
      theme: 'animals',
      userPrompt: 'friendly puppy',
      cardCount: 1,
      childAge: 6,
      style: 'cartoon' as const,
      safetyLevel: 'strict' as const
    }
    
    const startTime = Date.now()
    const cards = await aiService.generatePersonalizedCards(testRequest)
    const endTime = Date.now()
    
    const result = {
      success: true,
      generationTime: `${endTime - startTime}ms`,
      provider: cards[0]?.generationMetadata.provider || 'unknown',
      cardGenerated: cards.length > 0,
      hasImageUrl: !!cards[0]?.imageUrl,
      imageType: cards[0]?.imageUrl?.startsWith('data:') ? 'base64' : 'url',
      prompt: cards[0]?.imagePrompt,
      label: cards[0]?.label,
      safetyCheck: cards[0]?.generationMetadata.safetyCheck
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
