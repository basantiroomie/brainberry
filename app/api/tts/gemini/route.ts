import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    console.log('🔊 Gemini TTS: Generating audio for text:', text.substring(0, 50))

    // Use Gemini TTS model
    const ttsModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-tts",
      generationConfig: {
        temperature: 0.6,
        topK: 16,
        topP: 0.9,
        maxOutputTokens: 512
      }
    })

    const ttsResponse = await ttsModel.generateContent([
      `Generate natural, child-friendly speech for: "${text}"`
    ])

    const response = await ttsResponse.response
    
    // Extract audio data from response
    // Note: The exact structure depends on Gemini's TTS response format
    const candidates = response.candidates
    if (candidates && candidates[0] && candidates[0].content) {
      const content = candidates[0].content
      
      // Look for audio data in the response
      if (content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.includes('audio')) {
            console.log('🔊 Gemini TTS: Audio generation successful')
            return NextResponse.json({
              success: true,
              audioData: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            })
          }
        }
      }
    }

    // If no audio found in response, return error
    console.warn('🔊 Gemini TTS: No audio data found in response')
    return NextResponse.json({ 
      error: 'No audio data generated',
      success: false 
    }, { status: 500 })

  } catch (error) {
    console.error('🔊 Gemini TTS: Generation failed:', error)
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json({ 
          error: 'Gemini TTS quota exceeded',
          success: false 
        }, { status: 429 })
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json({ 
          error: 'Invalid API key',
          success: false 
        }, { status: 401 })
      }
    }

    return NextResponse.json({ 
      error: 'Gemini TTS generation failed',
      success: false 
    }, { status: 500 })
  }
}
