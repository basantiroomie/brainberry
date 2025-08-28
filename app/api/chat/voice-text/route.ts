import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI for voice-optimized text chat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Gemini Live model for conversational responses
const geminiLiveModel = genAI.getGenerativeModel({ 
  model: "gemini-live-2.5-flash-preview",
  generationConfig: {
    temperature: 0.7,
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 1024,
  }
})

// Gemini TTS model for voice synthesis
const geminiTTSModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-preview-tts",
  generationConfig: {
    temperature: 0.6,
    topK: 16,
    topP: 0.9,
    maxOutputTokens: 512,
  }
})

export async function POST(request: NextRequest) {
  try {
    const { message, childId, accessCode, mode } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 })
    }

    // Generate response using Gemini Live for conversational flow
    const conversationPrompt = `
      You are a friendly, educational AI companion for children in voice chat mode. 
      A child just typed: "${message}"
      
      Respond in a way that is:
      - Age-appropriate (5-12 years old)
      - Encouraging and positive
      - Educational when possible
      - Fun and engaging
      - Safe and wholesome
      - Optimized for voice delivery (natural speech patterns)
      - DO NOT use emojis (they don't work well with text-to-speech)
      
      Keep your response to 1-2 sentences maximum since this will be spoken aloud.
      Use simple vocabulary and conversational tone as if speaking directly to the child.
    `

    const conversationResult = await geminiLiveModel.generateContent(conversationPrompt)
    let responseText = conversationResult.response.text().trim()
    
    // Clean up emojis and unwanted characters for TTS
    responseText = responseText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    responseText = responseText.replace(/[😀😁😂😃😄😅😆😇😈😉😊😋😌😍😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜😝😞😟😠😡😢😣😤😥😦😧😨😩😪😫😬😭😮😯😰😱😲😳😴😵😶😷😸😹😺😻😼😽😾😿🙀🙁🙂🙃🙄🙅🙆🙇🙈🙉🙊🙋🙌🙍🙎🙏]/g, '');
    responseText = responseText.replace(/:\w+:/g, ''); // Remove :emoji_name: format
    responseText = responseText.trim();

    // Generate high-quality audio using Gemini TTS
    let audioUrl = null
    try {
      const ttsPrompt = `
        Convert this text to natural, child-friendly speech with appropriate intonation:
        "${responseText}"
        
        Use a warm, friendly voice that sounds like a caring teacher or parent.
        Speak clearly and at an appropriate pace for children.
        Add natural pauses and emphasis where appropriate.
      `

      const ttsRequest = {
        contents: [{
          role: "user",
          parts: [{ text: ttsPrompt }]
        }]
      }

      const ttsResult = await geminiTTSModel.generateContent(ttsRequest)
      
      // Note: In a real implementation, you would extract the audio data from the TTS response
      // and either save it to a file storage service or convert it to a data URL
      // For now, we'll return null and fall back to browser TTS
      console.log('TTS generation completed for voice-text mode')
      audioUrl = null
      
    } catch (ttsError) {
      console.error('TTS generation error:', ttsError)
      audioUrl = null
    }

    // Determine facial expression based on response content
    let facialExpression = 'friendly'
    const responseContent = responseText.toLowerCase()
    
    if (responseContent.includes('great') || responseContent.includes('excellent') || responseContent.includes('wonderful')) {
      facialExpression = 'smile'
    } else if (responseContent.includes('question') || responseContent.includes('think')) {
      facialExpression = 'curious'
    } else if (responseContent.includes('help') || responseContent.includes('support')) {
      facialExpression = 'caring'
    }

    return NextResponse.json({
      text: responseText,
      audioUrl, // Will be null until TTS audio extraction is implemented
      facialExpression,
      model: 'gemini-live-2.5-flash-preview',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Voice-text chat API error:', error)
    
    // Fallback response
    const fallbackResponses = [
      "That's really interesting! Can you tell me more?",
      "I love chatting with you! What else would you like to talk about?",
      "That sounds exciting! What do you think about that?",
      "You're so smart! What other questions do you have?",
      "That's a great point! What else is on your mind?"
    ]
    
    const fallbackText = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    
    return NextResponse.json({
      text: fallbackText,
      audioUrl: null,
      facialExpression: 'friendly',
      model: 'fallback',
      timestamp: new Date().toISOString()
    }, { status: 200 }) // Return 200 for graceful fallback
  }
}
