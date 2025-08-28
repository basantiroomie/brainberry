import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as File
    const childId = formData.get('childId') as string

    if (!audioBlob) {
      return NextResponse.json({ 
        error: 'No audio file provided' 
      }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured' 
      }, { status: 500 })
    }

    console.log('🎤 Voice Chat: Processing audio for child:', childId)

    // Convert audio blob to base64
    const audioBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    let conversationResult
    
    try {
      // Try primary Gemini Live model first
      console.log('🎤 Voice Chat: Attempting gemini-live-2.5-flash-preview')
      const primaryModel = genAI.getGenerativeModel({ 
        model: "gemini-live-2.5-flash-preview",
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })

      conversationResult = await primaryModel.generateContent([
        {
          inlineData: {
            mimeType: audioBlob.type || "audio/wav",
            data: audioBase64
          }
        },
        `You are a friendly AI companion for children. Listen to this audio message and respond naturally. 
         Keep your response:
         - Age-appropriate (5-12 years)
         - Encouraging and positive
         - 1-2 sentences maximum
         - Fun and engaging
         - Safe and educational when possible
         
         Respond as if you're having a real conversation with the child.`
      ])

      console.log('🎤 Voice Chat: Primary model successful')

    } catch (primaryError) {
      console.warn('🎤 Voice Chat: Primary model failed, trying fallback:', primaryError)
      
      try {
        // Fallback to secondary model
        console.log('🎤 Voice Chat: Attempting gemini-2.0-flash-live-001')
        const fallbackModel = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash-live-001",
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })

        conversationResult = await fallbackModel.generateContent([
          {
            inlineData: {
              mimeType: audioBlob.type || "audio/wav",
              data: audioBase64
            }
          },
          `You are a friendly AI companion for children. Listen to this audio message and respond naturally. 
           Keep your response:
           - Age-appropriate (5-12 years)
           - Encouraging and positive
           - 1-2 sentences maximum
           - Fun and engaging
           - Safe and educational when possible
           
           Respond as if you're having a real conversation with the child.`
        ])

        console.log('🎤 Voice Chat: Fallback model successful')

      } catch (fallbackError) {
        console.error('🎤 Voice Chat: Both models failed:', fallbackError)
        
        // Return a fallback text response
        return NextResponse.json({
          success: true,
          text: "I heard you! That's really interesting. Tell me more about what you're thinking!",
          transcription: "[Audio processed]",
          provider: 'fallback'
        })
      }
    }

    const responseText = conversationResult.response.text().trim()
    
    // Clean up the response (remove any technical artifacts)
    const cleanedText = responseText
      .replace(/\*\*\([^)]*\)\*\*/g, '') // Remove **(anything)**
      .replace(/\*\*[^*]*\*\*/g, '') // Remove **anything**
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .trim()

    console.log('🎤 Voice Chat: Response generated:', cleanedText.substring(0, 50))

    return NextResponse.json({
      success: true,
      text: cleanedText,
      transcription: "[Voice message processed]", // Gemini Live handles this internally
      provider: 'gemini-live'
    })

  } catch (error) {
    console.error('🎤 Voice Chat: Unexpected error:', error)
    
    return NextResponse.json({
      success: true,
      text: "I'm having trouble understanding right now. Can you try again?",
      transcription: "[Error processing audio]",
      provider: 'error-fallback'
    }, { status: 200 }) // Return 200 to avoid breaking the chat flow
  }
}
