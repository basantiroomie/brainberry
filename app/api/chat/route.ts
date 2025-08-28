import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { logger } from '@/utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Fallback responses for when Gemini API fails
const FALLBACK_RESPONSES = [
  {
    text: "That's really interesting! Tell me more about what you're thinking.",
    facialExpression: 'smile',
    animation: 'Listening'
  },
  {
    text: "You're doing great! I love hearing your thoughts.",
    facialExpression: 'smile',
    animation: 'Idle'
  },
  {
    text: "That sounds wonderful! What else would you like to talk about?",
    facialExpression: 'excited',
    animation: 'Talking'
  },
  {
    text: "I'm here to listen and chat with you anytime!",
    facialExpression: 'smile',
    animation: 'Idle'
  }
];

export async function POST(req: NextRequest) {
  try {
    console.log('Chat API: Request received')
    
    const body = await req.json();
    console.log('Chat API: Body parsed:', { 
      hasMessage: !!body.message, 
      hasChildId: !!body.childId,
      messageLength: body.message?.length 
    })
    
    const { message, childId, accessCode } = body;

    // Validate required fields
    if (!message || !childId) {
      console.warn('Chat API: Missing required fields', { 
        hasMessage: !!message, 
        hasChildId: !!childId 
      });
      return NextResponse.json({ 
        error: 'Message and childId are required' 
      }, { status: 400 });
    }

    // Skip authentication for now to test basic functionality
    console.log('Chat API: Skipping authentication for testing')

    // Generate AI response using Gemini
    let aiResponse;
    try {
      console.log('Chat API: Attempting Gemini generation')
      aiResponse = await generateGeminiResponse(message, childId);
      console.log('Chat API: Gemini response generated successfully', { 
        responseLength: aiResponse.text.length 
      });
    } catch (geminiError) {
      console.error('Chat API: Gemini API failed, using fallback', geminiError);
      aiResponse = getRandomFallbackResponse();
      console.log('Chat API: Using fallback response');
    }

    console.log('Chat API: Returning response:', aiResponse);
    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('Chat API: Unexpected error', error);
    const fallbackResponse = getRandomFallbackResponse();
    return NextResponse.json({ 
      error: 'Failed to get response',
      ...fallbackResponse
    }, { status: 500 });
  }
}

async function generateGeminiResponse(message: string, childId: string) {
  try {
    console.log('Gemini: Starting generation with API key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Create child-appropriate prompt
    const systemPrompt = `You are a friendly, supportive AI companion for a child. Your role is to:
- Be encouraging, positive, and supportive
- Keep responses short and age-appropriate (1-2 sentences max)
- Use simple, clear language that children can understand
- Be curious about the child's interests and ask follow-up questions
- Provide gentle guidance when appropriate
- Never give medical, legal, or safety advice
- Always maintain a warm, caring tone
- Use emojis occasionally to make responses more engaging
- DO NOT include any facial expressions, animations, or technical instructions in your response
- Respond ONLY with the message text that should be spoken to the child

The child said: "${message}"

Respond naturally as if you're having a real conversation with the child. Keep it fun and engaging!`;

    console.log('Gemini: Sending request to model');
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up any remaining technical artifacts or expressions
    text = text.replace(/\*\*\([^)]*\)\*\*/g, ''); // Remove **(anything)**
    text = text.replace(/\*\*[^*]*\*\*/g, ''); // Remove **anything**
    text = text.replace(/\([^)]*facial[^)]*\)/gi, ''); // Remove (facial expression...)
    text = text.replace(/\([^)]*animation[^)]*\)/gi, ''); // Remove (animation...)
    text = text.replace(/facial expression[^.!?]*/gi, ''); // Remove facial expression text
    text = text.replace(/animation[^.!?]*/gi, ''); // Remove animation text
    text = text.trim();
    
    console.log('Gemini: Response received and cleaned, length:', text.length);

    // Determine facial expression and animation based on response content (for internal use only)
    const facialExpression = determineFacialExpression(text);
    const animation = determineAnimation(text);

    return {
      text,
      facialExpression,
      animation
    };
  } catch (error) {
    console.error('Gemini: Generation failed:', error);
    throw error;
  }
}

function determineFacialExpression(text: string): 'smile' | 'neutral' | 'excited' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('amazing') || lowerText.includes('wonderful') || 
      lowerText.includes('fantastic') || lowerText.includes('great job') ||
      lowerText.includes('awesome') || lowerText.includes('excellent')) {
    return 'excited';
  }
  
  if (lowerText.includes('smile') || lowerText.includes('happy') || 
      lowerText.includes('fun') || lowerText.includes('love') ||
      lowerText.includes('like') || lowerText.includes('good')) {
    return 'smile';
  }
  
  return 'neutral';
}

function determineAnimation(text: string): 'Idle' | 'Talking' | 'Listening' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('tell me') || lowerText.includes('what') || 
      lowerText.includes('how') || lowerText.includes('?')) {
    return 'Listening';
  }
  
  if (text.length > 50) {
    return 'Talking';
  }
  
  return 'Idle';
}

function getRandomFallbackResponse() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[randomIndex];
}