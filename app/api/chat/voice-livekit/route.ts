import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Modality } from '@google/genai'
import { WaveFile } from 'wavefile'

// Real Gemini Live API with Audio Input/Output - Based on Official Google Documentation
export async function POST(req: Request) {
  try {
    console.log('Request received, content-type:', req.headers.get('content-type'));
    
    let body: any = {};
    let audioData: any = null;
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData requests
      console.log('Processing FormData request');
      const formData = await req.formData();
      
      // Extract fields from FormData
      const action = formData.get('action') as string;
      const childId = formData.get('childId') as string;
      const sessionId = formData.get('sessionId') as string;
      const instructions = formData.get('instructions') as string;
      const audioFile = formData.get('audio') as File;
      
      body = {
        action,
        childId,
        sessionId,
        instructions
      };
      
      if (audioFile && audioFile.size > 0) {
        // Convert audio file to buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        audioData = new Uint8Array(arrayBuffer);
        console.log('📁 Audio file received:', {
          name: audioFile.name,
          type: audioFile.type,
          size: audioFile.size,
          bufferLength: audioData.length
        });
      }
      
    } else {
      // Handle JSON requests (fallback)
      console.log('Processing JSON request');
      const rawBody = await req.text();
      console.log('Raw request body (first 200 chars):', rawBody.substring(0, 200));
      
      try {
        body = JSON.parse(rawBody);
        audioData = body.audioData;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Character at error position:', rawBody.charAt(1));
        console.error('First 50 chars of raw body:', JSON.stringify(rawBody.substring(0, 50)));
        return Response.json({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
          preview: rawBody.substring(0, 100)
        }, { status: 400 });
      }
    }
    
    console.log('Parsed request body:', body);
    const { sessionId, instructions, action } = body
    console.log('🎤 Parsed request:', { 
      hasAudioData: !!audioData, 
      sessionId, 
      hasInstructions: !!instructions, 
      action,
      audioDataLength: audioData ? audioData.length : 0
    })
    
    // Determine action if not provided - if we have audio data, it's audio processing
    const effectiveAction = action || (audioData ? 'process_audio' : 'create_session')
    console.log('🎤 Effective action:', effectiveAction)
    
    // Initialize Google GenAI with correct structure
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!
    })
    
    const sessionConfig = {
      model: "gemini-2.5-flash-preview-native-audio-dialog", // Native audio model
      sessionId: sessionId || `audio-live-${Date.now()}`,
      provider: 'gemini-live-audio'
    }
    
    switch (effectiveAction) {
      case 'create_session':
        try {
          // Create live session with proper response queue - following official docs
          const responseQueue: any[] = []
          
          async function waitMessage() {
            let done = false
            let message = undefined
            while (!done) {
              message = responseQueue.shift()
              if (message) {
                done = true
              } else {
                await new Promise((resolve) => setTimeout(resolve, 100))
              }
            }
            return message
          }
          
          const session = await ai.live.connect({
            model: "gemini-2.5-flash-preview-native-audio-dialog",
            callbacks: {
              onopen: function () {
                console.log('🎤 Live session opened')
              },
              onmessage: function (message) {
                console.log('🎤 Live session message:', message)
                responseQueue.push(message)
              },
              onerror: function (e) {
                console.error('🎤 Live session error:', e.message)
              },
              onclose: function (e) {
                console.log('🎤 Live session closed:', e.reason)
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              systemInstruction: instructions || "You are a helpful assistant for children's educational gaming. Respond in a friendly, encouraging tone suitable for voice interaction."
            }
          })
          
          return NextResponse.json({
            success: true,
            text: "Real Gemini Live native audio session created",
            session: {
              ...sessionConfig,
              audioCapabilities: {
                inputFormat: 'PCM 16-bit, 16kHz, mono',
                outputFormat: 'WAV 24kHz native audio',
                model: 'gemini-2.5-flash-preview-native-audio-dialog',
                realtime: true
              }
            },
            status: 'active',
            capabilities: {
              audioInput: true,
              audioOutput: true,
              nativeAudio: true,
              realtime: true,
              streaming: true
            }
          })
          
        } catch (liveError) {
          console.error('🎤 Gemini Live session error:', liveError)
          return NextResponse.json({
            success: false,
            error: 'Failed to create Gemini Live session',
            details: liveError instanceof Error ? liveError.message : 'Unknown error'
          }, { status: 500 })
        }
        
      case 'process_audio':
        if (!audioData) {
          return NextResponse.json({
            success: false,
            error: 'Audio data required for processing'
          }, { status: 400 })
        }
        
        try {
          console.log('🎤 Processing audio with real Gemini Live API...')
          
          const responseQueue: any[] = []
          
          async function waitMessage() {
            let done = false
            let message = undefined
            let attempts = 0
            const maxAttempts = 100 // 10 seconds total wait time
            
            while (!done && attempts < maxAttempts) {
              message = responseQueue.shift()
              if (message) {
                done = true
              } else {
                await new Promise((resolve) => setTimeout(resolve, 100))
                attempts++
              }
            }
            
            if (attempts >= maxAttempts) {
              console.log('🎤 Timeout waiting for message')
              return null
            }
            return message
          }
          
          async function handleTurn() {
            const turns = []
            let done = false
            let setupComplete = false
            
            // Wait for setup completion first
            while (!setupComplete) {
              const message = await waitMessage()
              if (!message) {
                console.log('🎤 Setup timeout, breaking')
                break
              }
              console.log('🎤 Setup message received:', message)
              console.log('🎤 Setup message keys:', Object.keys(message))
              
              // Check for setupComplete in different possible locations
              if (message.setupComplete || 
                  (message.serverContent && message.serverContent.setupComplete) ||
                  (typeof message === 'object' && 'setupComplete' in message)) {
                setupComplete = true
                console.log('🎤 Setup completed, now sending audio...')
              }
            }
            
            // Now wait for actual response turns
            let turnStarted = false
            while (!done && setupComplete) {
              const message = await waitMessage()
              if (!message) {
                console.log('🎤 Response timeout, finishing')
                done = true
                break
              }
              console.log('🎤 Turn message:', JSON.stringify(message, null, 2))
              turns.push(message)
              
              if (message.serverContent) {
                turnStarted = true
                if (message.serverContent.turnComplete) {
                  console.log('🎤 Turn completed')
                  done = true
                }
              }
              
              // If we've been waiting too long without a turn starting, break
              if (!turnStarted && turns.length > 10) {
                console.log('🎤 No turn started, finishing')
                done = true
              }
            }
            return turns
          }
          
          // Create live session for audio processing
          const session = await ai.live.connect({
            model: "gemini-2.5-flash-preview-native-audio-dialog",
            callbacks: {
              onopen: function () {
                console.log('🎤 Audio processing session opened')
              },
              onmessage: function (message) {
                console.log('🎤 Audio processing response:', message)
                console.log('🎤 Message type check:', typeof message, Object.keys(message))
                responseQueue.push(message)
              },
              onerror: function (e) {
                console.error('🎤 Audio processing error:', e.message)
              },
              onclose: function (e) {
                console.log('🎤 Audio processing session closed')
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              systemInstruction: instructions || "You are a helpful assistant for children. Respond with voice."
            }
          })
          
          // Prepare audio data - WebM is supported by Gemini Live directly
          let audioBase64: string
          let inputAudioLength = 0
          
          if (audioData instanceof Uint8Array) {
            // We have binary WebM audio data from frontend - convert to base64
            console.log('🎤 Converting WebM audio to base64 for Gemini Live...')
            inputAudioLength = audioData.length
            
            // Convert binary data to base64 - Gemini Live supports WebM directly
            audioBase64 = Buffer.from(audioData).toString('base64')
            console.log('🎤 WebM audio converted to base64, length:', audioBase64.length)
          } else {
            // Handle base64 string data (fallback)
            audioBase64 = typeof audioData === 'string' && audioData.includes(',') ? 
              audioData.split(',')[1] : audioData as string
            inputAudioLength = audioBase64.length
          }
          
          // Wait for session setup first
          console.log('🎤 Waiting for session setup...')
          
          // First wait for setup completion
          let setupComplete = false
          while (!setupComplete) {
            const message = await waitMessage()
            if (!message) {
              console.log('🎤 Setup timeout, proceeding anyway')
              setupComplete = true // Proceed even if no setup message
              break
            }
            console.log('🎤 Setup message received:', message)
            
            // Check for setupComplete in different possible locations
            if (message.setupComplete || 
                (message.serverContent && message.serverContent.setupComplete) ||
                (typeof message === 'object' && 'setupComplete' in message)) {
              setupComplete = true
              console.log('🎤 Setup completed!')
              break
            }
          }
          
          // Send audio immediately after setup - Gemini Live expects real-time audio streaming
          console.log('🎤 Sending audio chunk to Gemini Live...')
          session.sendRealtimeInput({
            audio: {
              data: audioBase64,
              mimeType: "audio/webm"
            }
          })
          
          // Wait for audio response with a reasonable timeout
          const turns = []
          let responseComplete = false
          let attempts = 0
          const maxResponseAttempts = 30 // 3 seconds - faster response
          
          console.log('🎤 Waiting for Gemini Live response...')
          while (!responseComplete && attempts < maxResponseAttempts) {
            const message = await waitMessage()
            if (!message) {
              attempts++
              continue
            }
            
            console.log('🎤 Response message:', message)
            turns.push(message)
            
            // Check for various completion signals
            if (message.serverContent && message.serverContent.turnComplete) {
              console.log('🎤 Turn completed')
              responseComplete = true
            } else if (message.serverContent && message.serverContent.modelTurn) {
              console.log('🎤 Model turn received, considering complete')
              responseComplete = true
            }
            
            attempts++
          }
          
          if (!responseComplete) {
            console.log('🎤 Response timeout after', attempts, 'attempts, proceeding with available data')
          }
          
          // Process audio response from Gemini Live
          let outputAudioBase64 = null
          let audioResponses: any[] = []
          
          for (const turn of turns) {
            console.log('🎤 Processing turn:', JSON.stringify(turn, null, 2))
            
            // Check for audio data in the response
            if (turn.serverContent?.modelTurn?.parts) {
              for (const part of turn.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.includes('audio')) {
                  console.log('🎤 Found audio response:', part.inlineData.mimeType)
                  audioResponses.push(part.inlineData.data)
                }
              }
            }
          }
          
          // Combine audio responses if multiple
          if (audioResponses.length > 0) {
            outputAudioBase64 = audioResponses.join('')
            console.log('🎤 Combined audio response length:', outputAudioBase64.length)
          }
          
          session.close()
          
          return NextResponse.json({
            success: true,
            text: "Audio processed with real Gemini Live native audio API",
            sessionId: sessionConfig.sessionId,
            model: sessionConfig.model,
            processing: {
              inputReceived: true,
              audioProcessed: true,
              audioDataLength: inputAudioLength,
              turnsReceived: turns.length,
              audioOutputGenerated: !!outputAudioBase64,
              outputAudio: outputAudioBase64,
              timestamp: new Date().toISOString()
            }
          })
          
        } catch (geminiError) {
          console.error('🎤 Gemini Live audio error:', geminiError)
          return NextResponse.json({
            success: false,
            error: 'Failed to process audio with Gemini Live',
            details: geminiError instanceof Error ? geminiError.message : 'Unknown error'
          }, { status: 500 })
        }
        
      default:
        return NextResponse.json({
          success: true,
          text: "Real Gemini Live Native Audio session ready",
          provider: 'gemini-live-native-audio',
          session: sessionConfig,
          status: 'ready',
          audioFeatures: {
            inputFormat: 'PCM 16-bit, 16kHz, mono (base64 encoded)',
            outputFormat: 'WAV 24kHz native audio (base64 encoded)',
            model: 'gemini-2.5-flash-preview-native-audio-dialog',
            realtime: true,
            nativeAudio: true
          },
          actions: [
            'create_session - Initialize live native audio session',
            'process_audio - Send audioData (base64) for AI native audio response'
          ],
          implementation: 'Uses official Google GenAI Live API with native audio models'
        })
    }

  } catch (error) {
    console.error('🎤 Gemini Live Audio Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Gemini Live audio chat failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
