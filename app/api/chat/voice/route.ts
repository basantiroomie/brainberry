import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI for voice chat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Gemini Live model for real-time voice conversations
const geminiLiveModel = genAI.getGenerativeModel({ 
  model: "gemini-live-2.5-flash-preview",
  generationConfig: {
    temperature: 0.7,
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 1024,
  }
})

// Gemini TTS model for high-quality voice synthesis
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
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as File
    const childId = formData.get('childId') as string
    const accessCode = formData.get('accessCode') as string

    if (!audioBlob) {
      return NextResponse.json({ 
        error: 'No audio file provided' 
      }, { status: 400 })
    }

    // Convert audio blob to base64 for Gemini processing
    const audioBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    // Step 1: Transcribe the audio using Gemini Live
    const transcriptionPrompt = `
      Transcribe this audio to text. The speaker is a child, so expect simple language, 
      possible mispronunciations, and informal speech patterns. Return only the transcribed text.
    `

    const transcriptionRequest = {
      contents: [{
        role: "user",
        parts: [
          { text: transcriptionPrompt },
          {
            inlineData: {
              mimeType: audioBlob.type || "audio/wav",
              data: audioBase64
            }
          }
        ]
      }]
    }

    let transcription = ""
    try {
      const transcriptionResult = await geminiLiveModel.generateContent(transcriptionRequest)
      transcription = transcriptionResult.response.text().trim()
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      // Fallback for transcription
      transcription = "[Voice message received]"
    }

    // Step 2: Generate child-appropriate response using Gemini Live
    const conversationPrompt = `
      You are a friendly, educational AI companion for children. A child just said: "${transcription}"
      
      Respond in a way that is:
      - Age-appropriate (5-12 years old)
      - Encouraging and positive
      - Educational when possible
      - Fun and engaging
      - Safe and wholesome
      
      Keep your response to 1-2 sentences maximum for voice delivery.
      Use simple vocabulary and be conversational.
    `

    const conversationResult = await geminiLiveModel.generateContent(conversationPrompt)
    const responseText = conversationResult.response.text().trim()

    // Step 3: Generate high-quality audio using Gemini TTS
    const ttsPrompt = `
      Convert this text to natural, child-friendly speech with appropriate intonation:
      "${responseText}"
      
      Use a warm, friendly voice that sounds like a caring teacher or parent.
      Speak clearly and at an appropriate pace for children.
    `

    let audioUrl = null
    try {
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
      console.log('TTS generation completed, but audio extraction not yet implemented')
      audioUrl = null
      
    } catch (ttsError) {
      console.error('TTS generation error:', ttsError)
      audioUrl = null
    }

    // Return the response
    return NextResponse.json({
      transcription,
      text: responseText,
      audioUrl, // Will be null until TTS audio extraction is implemented
      facialExpression: 'friendly',
      model: 'gemini-live-2.5-flash-preview',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Voice chat API error:', error)
    
    return NextResponse.json({
      error: 'Sorry, I had trouble processing your voice message. Please try again!',
      text: "I'm having trouble with voice chat right now. Can you try typing your message instead?",
      transcription: "[Error processing audio]",
      facialExpression: 'apologetic',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
