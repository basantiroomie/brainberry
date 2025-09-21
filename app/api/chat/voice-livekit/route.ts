import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Modality } from '@google/genai'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { WaveFile } from 'wavefile'

export const runtime = 'nodejs'

// Store active sessions in memory (in production, use Redis or similar)
const activeSessions = new Map<string, any>()

// Model fallback hierarchy - using correct model names for Gemini Live
const MODEL_FALLBACK_HIERARCHY = [
  'gemini-live-2.5-flash-preview',                   // User's preferred model
  'gemini-2.0-flash-live-001',                       // User's default choice  
  'gemini-2.5-flash-preview-native-audio-dialog'     // Fallback - Native audio dialog
]

// Track failed models to avoid retrying them immediately
const failedModels = new Set<string>()

// Helper function to convert WebM (Opus) to 16-bit PCM @16kHz mono using ffmpeg (always attempt if available)
async function convertAudioForModel(audioData: Uint8Array, model: string): Promise<{ data: string, mimeType: string }> {
  console.log('🎤 Converting to PCM format for model:', model)

  const canUseFfmpeg = ffmpegPath && fs.existsSync(ffmpegPath as string)
  if (!canUseFfmpeg) {
    console.warn('🎤 ffmpeg not available (or path missing). Returning original WebM (Gemini may reject). Install/enable ffmpeg-static for proper PCM conversion.')
    const audioBase64 = Buffer.from(audioData).toString('base64')
    return { data: audioBase64, mimeType: 'audio/webm' }
  }

  return new Promise<{ data: string, mimeType: string }>((resolve, reject) => {
    try {
      const resolved = ffmpegPath as string
      const ffmpeg = spawn(resolved, [
        '-hide_banner',
        '-loglevel', 'error',
        '-f', 'webm', // input format
        '-i', 'pipe:0', // read from stdin
        '-ac', '1', // mono
        '-ar', '16000', // 16 kHz
        '-f', 's16le', // raw PCM 16-bit
        'pipe:1' // write to stdout
      ])

      const chunks: Buffer[] = []
      ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk as Buffer))
      ffmpeg.stderr.on('data', (err) => {
        const msg = err.toString()
        if (msg.trim()) console.warn('🎤 ffmpeg stderr:', msg.trim())
      })
      ffmpeg.on('error', (err) => reject(err))
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          const pcmBuffer = Buffer.concat(chunks as any)
          const base64 = pcmBuffer.toString('base64')
          resolve({ data: base64, mimeType: 'audio/pcm;rate=16000' })
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`))
        }
      })

      ffmpeg.stdin.end(Buffer.from(audioData))
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Gemini Live API - Session-Based Implementation with Model Fallback
 * 
 * This implementation properly uses Gemini Live sessions with automatic fallback:
 * 1. Tries premium models first, falls back to basic models when quota exceeded
 * 2. Create a session once with 'create_session'
 * 3. Stream audio chunks to the same session with 'stream_audio'
 * 4. Session automatically handles audio processing via callbacks
 * 5. No manual message queuing - the session handles everything
 * 6. Close session when done with 'close_session'
 */

// Add response queue handling functions based on official Gemini Live docs
async function waitMessage(responseQueue: any[]) {
  let done = false;
  let message = undefined;
  while (!done) {
    message = responseQueue.shift();
    if (message) {
      done = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return message;
}

async function handleTurn(responseQueue: any[]) {
  const turns = [];
  let done = false;
  const maxWaitTime = 30000; // 30 seconds timeout
  const startTime = Date.now();
  
  while (!done && (Date.now() - startTime) < maxWaitTime) {
    try {
      const message = await Promise.race([
        waitMessage(responseQueue),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      turns.push(message);
      console.log('🎤 Turn message received:', JSON.stringify(message, null, 2));
      
      // Check for turn completion with different possible formats
      if (
        (message.serverContent && message.serverContent.turnComplete) ||
        (message.turnComplete) ||
        (message.candidates && message.candidates.length > 0) ||
        (message.serverContent?.modelTurn?.parts && message.serverContent.modelTurn.parts.length > 0)
      ) {
        console.log('🎤 Turn completion detected');
        done = true;
      }
      
      // Also check if we have enough content to respond
      if (turns.length >= 3) {
        console.log('🎤 Maximum turns reached, completing');
        done = true;
      }
      
    } catch (error: any) {
      if ((error as any).message === 'Timeout') {
        console.log('🎤 Message wait timeout, checking if we have any content...');
        if (turns.length > 0) {
          console.log('🎤 Have some content, completing turn');
          done = true;
        } else {
          console.log('🎤 No content yet, continuing...');
        }
      } else {
        console.error('🎤 Error in handleTurn:', error);
        break;
      }
    }
  }
  
  if (!done) {
    console.warn('🎤 Turn handling timed out after 30 seconds');
  }
  
  console.log(`🎤 HandleTurn completed with ${turns.length} turns`);
  return turns;
}

// Helper function to create session with model fallback using proper response queue pattern
async function createSessionWithFallback(ai: GoogleGenAI, instructions: string, currentSessionId: string, responseQueue: any[]) {
  const availableModels = MODEL_FALLBACK_HIERARCHY.filter(model => !failedModels.has(model))
  
  if (availableModels.length === 0) {
    // Reset failed models if all have failed (maybe quota reset)
    failedModels.clear()
    availableModels.push(...MODEL_FALLBACK_HIERARCHY)
  }
  
  let lastError: any = null
  
  for (const model of availableModels) {
    try {
      console.log('🎤 Attempting to create session with model:', model)
      
      const session = await ai.live.connect({
        model: model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: instructions || "You are a helpful assistant for children. Respond briefly and kindly."
        },
        callbacks: {
          onopen: function () {
            console.log('🎤 Live session opened with model:', model, 'sessionId:', currentSessionId)
          },
          onmessage: function (message) {
            console.log('🎤 Live session message received:', JSON.stringify(message, null, 2))
            // Use the proper response queue pattern from the official docs
            responseQueue.push(message)
          },
          onerror: function (e) {
            console.error('🎤 Live session error with model:', model)
            console.error('🎤 Error details:', e)
            console.error('🎤 Error message:', e.message)
            console.error('🎤 Error type:', e.type)
          },
          onclose: function (e) {
            console.log('🎤 Live session closed with code:', e.code, 'reason:', e.reason)
            console.log('🎤 Close event details:', e)
            // Mark session as closed but keep it for debugging
            const sessionData = activeSessions.get(currentSessionId)
            if (sessionData) {
              sessionData.status = 'closed'
              sessionData.closeReason = e.reason
              sessionData.closeCode = e.code
              sessionData.closedAt = new Date().toISOString()
              
              // Check if this was a quota error or invalid model error and mark the model as failed
              if (e.reason && (e.reason.toLowerCase().includes('quota') || 
                              e.reason.toLowerCase().includes('billing') ||
                              e.reason.toLowerCase().includes('exceeded') ||
                              e.reason.toLowerCase().includes('not found') ||
                              e.reason.toLowerCase().includes('not supported') ||
                              e.reason.toLowerCase().includes('invalid argument'))) {
                console.log('🎤 Model failed for model:', model, '- marking as failed for future sessions')
                failedModels.add(model)
              }
            }
          }
        }
      })
      
      console.log('🎤 Successfully created session with model:', model)
      return { session, model }
      
    } catch (error) {
      console.warn('🎤 Failed to create session with model:', model, 'error:', error)
      lastError = error
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                          errorMessage.toLowerCase().includes('billing') ||
                          errorMessage.toLowerCase().includes('exceeded')
      
      if (isQuotaError) {
        console.log('🎤 Quota exceeded for model:', model, '- marking as failed and trying next model')
        failedModels.add(model)
      } else {
        // For non-quota errors, don't mark as permanently failed
        console.log('🎤 Non-quota error for model:', model, '- will retry later')
      }
      
      // Continue to next model
    }
  }
  
  // If we get here, all models failed
  throw lastError || new Error('All models failed to create session')
}

// Real Gemini Live API with Audio Input/Output - Proper Session-Based Implementation
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
        return NextResponse.json({ 
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
    
    // Determine action if not provided - if we have audio data, it's audio streaming
    const effectiveAction = action || (audioData ? 'stream_audio' : 'create_session')
    console.log('🎤 Gemini Live request:', { action, sessionId: sessionId?.substring(0, 8) })
    
    // Enhanced environment check with detailed logging
    if (!process.env.GEMINI_API_KEY) {
      console.error('🎤 CRITICAL: GEMINI_API_KEY environment variable is missing')
      console.error('🎤 Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')))
      return NextResponse.json({
        success: false,
        error: 'API configuration error',
        details: 'Gemini API key not configured on server. Please check Vercel environment variables.',
        isQuotaError: false,
        configError: true
      }, { status: 500 })
    }

    // Validate API key format
    const apiKey = process.env.GEMINI_API_KEY.trim()
    if (!apiKey || apiKey.length < 20) {
      console.error('🎤 Invalid GEMINI_API_KEY format or too short')
      return NextResponse.json({
        success: false,
        error: 'Invalid API key format',
        details: 'Gemini API key appears to be malformed or missing',
        isQuotaError: false,
        configError: true
      }, { status: 500 })
    }

    console.log('🎤 API Key validated:', apiKey.substring(0, 10) + '...')
    
    // Initialize Google GenAI with error handling
    let ai: GoogleGenAI
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey
      })
    } catch (error) {
      console.error('🎤 Failed to initialize GoogleGenAI:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize AI service',
        details: error instanceof Error ? error.message : 'Unknown initialization error',
        isQuotaError: false,
        configError: true
      }, { status: 500 })
    }
    
    const currentSessionId = sessionId || `audio-live-${Date.now()}`
    
    switch (effectiveAction) {
      case 'create_session':
      case 'start': // Backward compatibility
        try {
          console.log('🎤 Creating new Gemini Live session:', currentSessionId)
          
          // Create response queue for this session (official pattern)
          const responseQueue: any[] = []
          
          // Create live session with model fallback
          const { session, model } = await createSessionWithFallback(
            ai, 
            instructions || "You are a helpful assistant for children's educational gaming. Respond in a friendly, encouraging tone suitable for voice interaction.",
            currentSessionId,
            responseQueue
          )
          
          // Store session for future use
          activeSessions.set(currentSessionId, {
            session,
            responseQueue,
            createdAt: new Date().toISOString(),
            model: model,
            status: 'active'
          })
          
          return NextResponse.json({
            success: true,
            text: "Gemini Live audio session created and ready for streaming",
            sessionId: currentSessionId,
            model: model,
            status: 'active',
            capabilities: {
              audioInput: true,
              audioOutput: true,
              nativeAudio: true,
              realtime: true,
              streaming: true,
              persistent: true
            },
            instructions: "Send audio data to 'stream_audio' action with this sessionId"
          })
          
        } catch (liveError) {
          console.error('🎤 Gemini Live session creation error:', liveError)
          
          // Check if it's a quota error
          const errorMessage = liveError instanceof Error ? liveError.message : 'Unknown error'
          const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                              errorMessage.toLowerCase().includes('billing')
          
          return NextResponse.json({
            success: false,
            error: isQuotaError ? 'API quota exceeded' : 'Failed to create Gemini Live session',
            details: errorMessage,
            isQuotaError,
            fallbackSuggestion: isQuotaError ? 
              'Please check your Gemini API billing and quota settings' : 
              'Try again or check your API key'
          }, { status: isQuotaError ? 429 : 500 })
        }
        
      case 'stream_audio':
        if (!audioData) {
          return NextResponse.json({
            success: false,
            error: 'Audio data required for streaming'
          }, { status: 400 })
        }
        
        const sessionData = activeSessions.get(currentSessionId)
        if (!sessionData) {
          return NextResponse.json({
            success: false,
            error: 'Session not found. Create a session first.',
            sessionId: currentSessionId
          }, { status: 404 })
        }
        
        if (sessionData.status === 'closed') {
          // Try to create a new session with a different model if the current one failed
          if (sessionData.closeReason && (sessionData.closeReason.toLowerCase().includes('quota') || 
                                         sessionData.closeReason.toLowerCase().includes('billing') ||
                                         sessionData.closeReason.toLowerCase().includes('exceeded') ||
                                         sessionData.closeReason.toLowerCase().includes('not found') ||
                                         sessionData.closeReason.toLowerCase().includes('not supported'))) {
            
            console.log('🎤 Previous session closed due to quota, attempting to recreate with fallback model...')
            
            try {
              // Create response queue for new session
              const responseQueue: any[] = []
              
              // Create new session with model fallback
              const { session, model } = await createSessionWithFallback(
                ai, 
                instructions || "You are a helpful assistant for children's educational gaming. Respond in a friendly, encouraging tone suitable for voice interaction.",
                currentSessionId,
                responseQueue
              )
              
              // Update session data
              activeSessions.set(currentSessionId, {
                session,
                responseQueue,
                createdAt: new Date().toISOString(),
                model: model,
                status: 'active'
              })
              
              console.log('🎤 Successfully recreated session with fallback model:', model)
              
              // Continue with audio streaming below
              
            } catch (recreateError) {
              console.error('🎤 Failed to recreate session with fallback:', recreateError)
              return NextResponse.json({
                success: false,
                error: 'All models have exceeded quota limits',
                details: recreateError instanceof Error ? recreateError.message : 'Unknown error',
                suggestion: 'Please try again later or check your API billing'
              }, { status: 503 })
            }
          } else {
            return NextResponse.json({
              success: false,
              error: 'Session is closed. Reason: ' + (sessionData.closeReason || 'Unknown'),
              sessionId: currentSessionId,
              details: 'Create a new session to continue'
            }, { status: 410 })
          }
        }
        
        try {
          console.log('🎤 Streaming audio to existing session:', currentSessionId)
          
          // Prepare audio for Live API: accept pre-converted base64 PCM or convert from WebM
          let audioBase64: string
          let mimeType: string
          if (typeof audioData === 'string') {
            // Client already sent base64 PCM
            audioBase64 = audioData
            mimeType = (body && body.mimeType) ? body.mimeType : 'audio/pcm;rate=16000'
            console.log('🎤 Using client-supplied PCM audio, length:', audioBase64.length)
          } else {
            const converted = await convertAudioForModel(audioData as Uint8Array, sessionData.model)
            audioBase64 = converted.data
            mimeType = converted.mimeType
            console.log('🎤 Audio converted for model:', sessionData.model, 'format:', mimeType, 'length:', audioBase64.length)
          }
          
          // Stream audio to the existing session
          sessionData.session.sendRealtimeInput({
            audio: {
              data: audioBase64,
              mimeType: mimeType
            }
          })
          
          console.log('🎤 Audio sent to session, waiting for turn completion...')
          
          // Use the official response queue pattern to wait for complete turn
          const turns = await handleTurn(sessionData.responseQueue)
          
          // Extract audio and text responses from completed turn
          let audioResponses: string[] = []
          let textResponses: string[] = []
          
          const audioMimeTypes: string[] = []
          for (const turn of turns) {
            // Check for audio responses in turn data
            if (turn.serverContent?.modelTurn?.parts) {
              for (const part of turn.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.includes('audio') && part.inlineData?.data) {
                  console.log('🎤 Audio response found in turn, length:', part.inlineData.data.length)
                  audioResponses.push(part.inlineData.data)
                  if (part.inlineData.mimeType && !audioMimeTypes.includes(part.inlineData.mimeType)) {
                    audioMimeTypes.push(part.inlineData.mimeType)
                  }
                }
                if (part.text) {
                  console.log('🎤 Text response found in turn:', part.text.substring(0, 100))
                  textResponses.push(part.text)
                }
              }
            }
            
            // Check for output transcription
            if (turn.serverContent?.outputTranscription) {
              console.log('🎤 Output transcription:', turn.serverContent.outputTranscription.text)
              textResponses.push(turn.serverContent.outputTranscription.text)
            }
          }
          
          const combinedAudio = audioResponses.join('')
          const combinedText = textResponses.join(' ')
          
          console.log('🎤 Turn completed:', {
            turnsReceived: turns.length,
            audioResponsesCount: audioResponses.length,
            textResponsesCount: textResponses.length,
            combinedAudioLength: combinedAudio.length,
            model: sessionData.model
          })
          
          // Always return a response, even if we didn't get perfect audio/text
          let responseText = combinedText || "I heard you! Can you say that again?"
          let outputAudioData = combinedAudio || null
          
          // If we have no meaningful response, create a fallback
          if (!responseText || responseText.trim().length < 3) {
            responseText = "That's interesting! Tell me more."
          }
          
          console.log('🎤 Sending response:', { hasAudio: !!outputAudioData, textLength: responseText.length })
          
          return NextResponse.json({
            success: true,
            text: responseText,
            audioData: outputAudioData,
            audioMimeType: audioMimeTypes[0] || undefined,
            transcription: responseText,
            provider: 'gemini-live-livekit',
            model: sessionData.model,
            turnsProcessed: turns.length,
            streaming: {
              audioSent: true,
              audioDataLength: audioBase64.length,
              audioResponseReceived: combinedAudio.length > 0,
              textResponseReceived: combinedText.length > 0,
              timestamp: new Date().toISOString()
            }
          })
          
        } catch (streamError) {
          console.error('🎤 Audio streaming error:', streamError)
          return NextResponse.json({
            success: false,
            error: 'Failed to stream audio to session',
            details: streamError instanceof Error ? streamError.message : 'Unknown error'
          }, { status: 500 })
        }
        
      case 'close_session':
      case 'end': // Backward compatibility
        const closeSessionData = activeSessions.get(currentSessionId)
        if (closeSessionData) {
          closeSessionData.session.close()
          activeSessions.delete(currentSessionId)
          return NextResponse.json({
            success: true,
            text: "Session closed successfully",
            sessionId: currentSessionId
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Session not found',
            sessionId: currentSessionId
          }, { status: 404 })
        }
        
      case 'reset_models':
        // Reset failed models (in case quota was increased or reset)
        const previousFailedCount = failedModels.size
        failedModels.clear()
        
        return NextResponse.json({
          success: true,
          text: `Reset ${previousFailedCount} failed models`,
          availableModels: MODEL_FALLBACK_HIERARCHY,
          message: 'All models are now available for retry'
        })
        
      case 'get_model_status':
        return NextResponse.json({
          success: true,
          modelHierarchy: MODEL_FALLBACK_HIERARCHY,
          failedModels: Array.from(failedModels),
          availableModels: MODEL_FALLBACK_HIERARCHY.filter(model => !failedModels.has(model)),
          activeSessions: activeSessions.size,
          sessionsDetails: Array.from(activeSessions.entries()).map(([id, data]) => ({
            sessionId: id,
            model: data.model,
            status: data.status,
            createdAt: data.createdAt,
            closedAt: data.closedAt,
            closeReason: data.closeReason
          }))
        })
        
      case 'get_session_status':
        const statusSessionData = activeSessions.get(currentSessionId)
        if (statusSessionData) {
          return NextResponse.json({
            success: true,
            sessionId: currentSessionId,
            status: 'active',
            model: statusSessionData.model,
            createdAt: statusSessionData.createdAt,
            responseQueueLength: statusSessionData.responseQueue.length
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Session not found',
            sessionId: currentSessionId
          }, { status: 404 })
        }
        
      default:
        return NextResponse.json({
          success: true,
          text: "Gemini Live Native Audio API - Session-Based Implementation with Model Fallback",
          provider: 'gemini-live-native-audio',
          status: 'ready',
          activeSessions: activeSessions.size,
          modelFallback: {
            hierarchy: MODEL_FALLBACK_HIERARCHY,
            failedModels: Array.from(failedModels),
            availableModels: MODEL_FALLBACK_HIERARCHY.filter(model => !failedModels.has(model))
          },
          audioFeatures: {
            inputFormat: 'WebM audio (base64 encoded)',
            outputFormat: 'Native audio (base64 encoded)',
            realtime: true,
            nativeAudio: true,
            persistent: true,
            automaticFallback: true
          },
          actions: [
            'create_session - Create a persistent live audio session (with automatic model fallback)',
            'stream_audio - Stream audio to existing session (requires sessionId)',
            'close_session - Close and cleanup session',
            'get_session_status - Get status of existing session',
            'reset_models - Reset failed model list (useful if quota was increased)',
            'get_model_status - Get current model status and session details'
          ],
          implementation: 'Uses persistent sessions with automatic model fallback when quota exceeded'
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
