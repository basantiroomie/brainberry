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
    const { message, childId, accessCode } = await req.json();

    // Validate required fields
    if (!message || !childId) {
      logger.warn('Chat API: Missing required fields', 'CHAT_API', { 
        hasMessage: !!message, 
        hasChildId: !!childId 
      });
      return NextResponse.json({ 
        error: 'Message and childId are required' 
      }, { status: 400 });
    }

    // Authenticate child using childId and accessCode
    if (accessCode) {
      const supabase = createSupabaseServiceClient();
      const { data: child, error } = await supabase
        .from('ChildProfile')
        .select('id, name, age, diagnosis')
        .eq('id', childId)
        .eq('access_code', accessCode)
        .single();

      if (error || !child) {
        logger.warn('Chat API: Child authentication failed', 'CHAT_API', { 
          childId, 
          error: error?.message 
        });
        return NextResponse.json({ 
          error: 'Invalid child credentials' 
        }, { status: 401 });
      }

      logger.debug('Chat API: Child authenticated successfully', 'CHAT_API', { 
        childId: child.id, 
        childName: child.name 
      });
    }

    // Generate AI response using Gemini
    let aiResponse;
    try {
      aiResponse = await generateGeminiResponse(message, childId);
      logger.debug('Chat API: Gemini response generated', 'CHAT_API', { 
        childId, 
        responseLength: aiResponse.text.length 
      });
    } catch (geminiError) {
      logger.error('Chat API: Gemini API failed, using fallback', geminiError, 'CHAT_API');
      aiResponse = getRandomFallbackResponse();
    }

    return NextResponse.json(aiResponse);

  } catch (error) {
    logger.error('Chat API: Unexpected error', error, 'CHAT_API');
    return NextResponse.json({ 
      error: 'Failed to get response',
      ...getRandomFallbackResponse()
    }, { status: 500 });
  }
}

async function generateGeminiResponse(message: string, childId: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  // Create child-appropriate prompt
  const systemPrompt = `You are a friendly, supportive AI companion for a child. Your role is to:
- Be encouraging, positive, and supportive
- Keep responses short and age-appropriate (1-2 sentences max)
- Use simple, clear language
- Be curious about the child's interests
- Provide gentle guidance when appropriate
- Never give medical, legal, or safety advice
- Always maintain a warm, caring tone

The child said: "${message}"

Respond in a way that shows you're listening and engaged. Also suggest an appropriate facial expression and animation for your avatar.`;

  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  const text = response.text();

  // Determine facial expression and animation based on response content
  const facialExpression = determineFacialExpression(text);
  const animation = determineAnimation(text);

  return {
    text: text.trim(),
    facialExpression,
    animation
  };
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