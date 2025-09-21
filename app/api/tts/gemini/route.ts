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

      // Use correct Gemini TTS models from https://ai.google.dev/gemini-api/docs/speech-generation
      const ttsModels = [
        "gemini-2.5-flash-preview-tts",  // Primary TTS model from documentation
        "gemini-2.5-pro-preview-tts"     // Backup TTS model from documentation
      ]

      // Child-friendly voice options from the speech generation documentation
      const childFriendlyVoices = [
        'Puck',        // Upbeat  
        'Zephyr',      // Bright
      ]

      // Try the new Google GenAI SDK format for better compatibility
      for (const modelName of ttsModels) {
        try {
          console.log(`🔊 Gemini TTS: Trying ${modelName} with new SDK format`)
          
          const model = genAI.getGenerativeModel({ 
            model: modelName
          })

          const result = await model.generateContent(text)
          const response = await result.response
          
          console.log(`🔊 Gemini TTS: Response from ${modelName}:`, JSON.stringify(response, null, 2))
          
          // Check for audio content in response candidates
          if (result.response.candidates && result.response.candidates[0]) {
            const candidate = result.response.candidates[0]
            
            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
              const part = candidate.content.parts[0]
              
              if (part.inlineData && part.inlineData.data) {
                const audioData = part.inlineData.data
                const mimeType = part.inlineData.mimeType || 'audio/wav'
                
                console.log(`🔊 Gemini TTS: Audio generation successful with ${modelName}`)
                console.log(`🔊 Gemini TTS: Audio data length: ${audioData?.length}, MIME type: ${mimeType}`)
                
                return NextResponse.json({
                  success: true,
                  audioData: audioData,
                  mimeType: mimeType,
                  provider: 'gemini-tts',
                  model: modelName,
                  voice: childFriendlyVoices[0],
                  isRealAudio: true
                })
              }
            }
          }

          console.warn(`🔊 Gemini TTS: ${modelName} did not return expected audio format`)

        } catch (modelError) {
          console.warn(`🔊 Gemini TTS: ${modelName} failed:`, modelError)
          continue
        }
      }

      // Fallback to direct API call if SDK doesn't work
      for (const modelName of ttsModels) {
        try {
          console.log(`🔊 Gemini TTS: Trying ${modelName} with direct API call`)
          
          // Use the exact format from speech generation documentation
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: 'POST',
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: text
                }]
              }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: childFriendlyVoices[0]
                    }
                  }
                }
              }
            })
          })

                  if (!response.ok) {
            const errorText = await response.text()
            console.warn(`🔊 Gemini TTS: ${modelName} API error:`, response.status, errorText)
            continue
          }

          const data = await response.json()
          console.log(`🔊 Gemini TTS: Response from ${modelName}:`, JSON.stringify(data, null, 2))
          
          // Check for audio content in response according to speech generation documentation
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const content = data.candidates[0].content
            
            if (content.parts && content.parts[0] && content.parts[0].inlineData) {
              const audioData = content.parts[0].inlineData.data
              const mimeType = content.parts[0].inlineData.mimeType
              
              console.log(`🔊 Gemini TTS: SUCCESSFUL audio generation with ${modelName}`)
              console.log(`🔊 Gemini TTS: Audio data length: ${audioData?.length}, MIME type: ${mimeType}`)
              
              return NextResponse.json({
                success: true,
                audioData: audioData,
                mimeType: mimeType || 'audio/wav',
                provider: 'gemini-tts',
                model: modelName,
                voice: childFriendlyVoices[0],
                isRealAudio: true  // Flag to indicate real Gemini TTS audio
              })
            }
          }

          console.warn(`🔊 Gemini TTS: ${modelName} did not return expected audio format`)

        } catch (modelError) {
          console.warn(`🔊 Gemini TTS: ${modelName} failed:`, modelError)
          continue
        }
      }

    // If no TTS models worked, try text optimization with regular model
    try {
      console.log('🔊 Gemini TTS: TTS models failed, optimizing text with regular model')
      const textModel = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.3,
          topK: 16,
          topP: 0.9,
          maxOutputTokens: 256
        }
      })

      const optimizationPrompt = `Optimize the following text for text-to-speech synthesis to make it sound natural when spoken to children. Fix pronunciation issues, add appropriate pauses, and ensure it flows naturally when read aloud. Return ONLY the optimized text without any additional formatting or explanations:

"${text}"`

      const optimizationResponse = await textModel.generateContent(optimizationPrompt)
      const optimizedText = optimizationResponse.response.text().trim()
      
      console.log('🔊 Gemini TTS: Text optimized for speech:', optimizedText.substring(0, 50))
      
      return NextResponse.json({
        success: true,
        optimizedText,
        provider: 'gemini-optimized-browser-tts',
        useBrowserTTS: true
      })

    } catch (error) {
      console.error('🔊 Gemini TTS: Text optimization also failed:', error)
      
      // Final fallback: return original text
      return NextResponse.json({
        success: true,
        optimizedText: text,
        provider: 'browser-tts-fallback',
        useBrowserTTS: true
      })
    }

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
