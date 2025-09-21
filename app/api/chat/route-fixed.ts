import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'
import { validateEnvironment } from '@/lib/env-validation'
import { logger } from '@/utils/logger'

// Validate environment on startup
const envValidation = validateEnvironment()
if (!envValidation.isValid) {
  console.error('🚨 Environment validation failed:', envValidation.missing)
}

// Initialize Gemini with enhanced validation
let genAI: GoogleGenerativeAI
try {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  
  const trimmedKey = apiKey.trim()
  if (trimmedKey.length < 20) {
    throw new Error('GEMINI_API_KEY appears to be invalid (too short)')
  }
  
  if (!trimmedKey.startsWith('AIza') && !trimmedKey.startsWith('AI')) {
    console.warn('⚠️ GEMINI_API_KEY may have unexpected format')
  }
  
  genAI = new GoogleGenerativeAI(trimmedKey)
  console.log('✅ Gemini AI initialized successfully')
} catch (error) {
  console.error('🚨 Failed to initialize Gemini:', error)
  // Create a dummy instance to prevent runtime errors during build
  genAI = new GoogleGenerativeAI('dummy-key-for-build')
}

// ===== CHATBOT CONFIGURATION =====
// Specialized for children with ADHD/ASD (ages 4-16)
const CHATBOT_SYSTEM_PROMPT = `You are a supportive, encouraging AI companion designed specifically for children with executive function challenges. Your role is to:
- Be patient, calm, and predictable in your responses
- Keep responses very short and clear (1-2 simple sentences maximum)
- Use concrete, literal language - avoid idioms, sarcasm, or abstract concepts
- Be consistent in your communication style and tone
- Acknowledge and validate the child's feelings and experiences
- Respect sensory sensitivities and processing differences
- Provide structure and routine in conversations when possible
- Break down complex ideas into smaller, manageable parts

IMPORTANT GUIDELINES:
- Always respond in simple, clear language
- Be encouraging and positive
- Avoid overwhelming the child with too much information
- Use the child's name when you know it
- Respond as if you're a caring friend or mentor
- If the child seems frustrated, acknowledge their feelings
- Keep responses short (maximum 2 sentences)`

const CUSTOM_INSTRUCTIONS = `
Additional Context:
- You are part of a learning platform called BrainBerry
- This child is working on developing executive function skills
- The child may have ADHD, autism, or other neurodevelopmental differences
- Your responses should be therapeutic and educational
- Focus on building confidence and celebrating small wins
`

// ===== FALLBACK RESPONSES =====
const FALLBACK_RESPONSES = [
  {
    text: "You're doing great! I love hearing your thoughts.",
    facialExpression: 'smile',
    animation: 'Idle'
  },
  {
    text: "That's really interesting! Tell me more about what you're thinking.",
    facialExpression: 'excited',
    animation: 'Talking'
  },
  {
    text: "I'm here to help you! What would you like to explore together?",
    facialExpression: 'smile',
    animation: 'Listening'
  },
  {
    text: "You're such a smart kid! I enjoy our conversations.",
    facialExpression: 'happy',
    animation: 'Idle'
  },
  {
    text: "I'm proud of how hard you're working! Keep it up!",
    facialExpression: 'excited',
    animation: 'Talking'
  }
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, childId, childName, childAge } = body

    console.log('Chat API: Request received', {
      hasMessage: !!message,
      childId,
      childName,
      childAge,
      messageLength: message?.length
    })

    if (!message || !childId) {
      return NextResponse.json({
        error: 'Message and childId are required'
      }, { status: 400 })
    }

    // Try Gemini first, with enhanced error handling
    try {
      const geminiResponse = await generateGeminiResponse(message, childId, childName, childAge)
      console.log('Chat API: Gemini response generated successfully')
      return NextResponse.json(geminiResponse)
    } catch (geminiError) {
      console.error('Chat API: Gemini API failed, using fallback', geminiError)
      
      // Enhanced error logging for debugging
      if (geminiError instanceof Error) {
        console.error('Chat API: Error details:', {
          message: geminiError.message,
          stack: geminiError.stack,
          name: geminiError.name
        })
        
        // Check if it's an API key issue
        if (geminiError.message.includes('API key not valid') || 
            geminiError.message.includes('API_KEY_INVALID')) {
          console.error('🚨 CRITICAL: Gemini API Key is invalid or not set properly')
          console.error('🔍 Current API key status:', {
            exists: !!process.env.GEMINI_API_KEY,
            length: process.env.GEMINI_API_KEY?.length || 0,
            prefix: process.env.GEMINI_API_KEY?.substring(0, 4) || 'none'
          })
        }
      }

      // Use fallback response
      console.log('Chat API: Using fallback response')
      const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
      const responseWithFallback = {
        ...fallbackResponse,
        provider: 'fallback'
      }
      
      console.log('Chat API: Returning response:', responseWithFallback)
      return NextResponse.json(responseWithFallback)
    }
  } catch (error) {
    console.error('Chat API: Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateGeminiResponse(message: string, childId: string, childName?: string, childAge?: number) {
  try {
    console.log('Gemini: Starting generation with API key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing')
    console.log('Gemini: API key length:', process.env.GEMINI_API_KEY?.length || 0)
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }

    // Use gemini-2.0-flash-exp model for better performance
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Get child information for personalization
    let childInfo = ''
    if (childName) {
      childInfo = `Child's name: ${childName}`
      if (childAge) {
        childInfo += `, Age: ${childAge}`
      }
    }

    const systemPrompt = `${CHATBOT_SYSTEM_PROMPT}

${CUSTOM_INSTRUCTIONS}

${childInfo}

The child said: "${message}"

IMPORTANT: ${childName ? `The child's name is ${childName}. Use this exact name when talking to them.` : 'The child has not provided their name.'} Never use placeholder text like [child's name] or [name] - always use their actual name if provided.

Respond naturally as if you're having a real conversation with this specific child. Use their name occasionally to make it personal, and keep their age in mind for appropriate responses. Keep it fun and engaging!`

    console.log('Gemini: Sending request to model')
    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up any remaining technical artifacts, expressions, and emojis
    text = text.replace(/\*\*\([^)]*\)\*\*/g, '') // Remove **(anything)**
    text = text.replace(/\*\*[^*]*\*\*/g, '') // Remove **anything**
    text = text.replace(/\([^)]*facial[^)]*\)/gi, '') // Remove (facial expression...)
    text = text.replace(/\([^)]*expression[^)]*\)/gi, '') // Remove (expression...)
    text = text.replace(/\([^)]*animation[^)]*\)/gi, '') // Remove (animation...)
    text = text.replace(/\*[^*]*\*/g, '') // Remove *anything*
    text = text.replace(/\[[^\]]*\]/g, '') // Remove [anything]
    text = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
    text = text.replace(/:\w+:/g, '') // Remove :emoji_name: format
    
    text = text.trim()
    
    console.log('Gemini: Response received and cleaned, length:', text.length)

    // Determine facial expression and animation based on response content (for internal use only)
    let facialExpression = 'smile'
    let animation = 'Talking'

    const lowerText = text.toLowerCase()
    if (lowerText.includes('exciting') || lowerText.includes('amazing') || lowerText.includes('wow')) {
      facialExpression = 'excited'
    } else if (lowerText.includes('?')) {
      animation = 'Listening'
    }

    return {
      text,
      facialExpression,
      animation,
      provider: 'gemini'
    }

  } catch (error) {
    console.error('Gemini: Generation failed:', error)
    throw error
  }
}
