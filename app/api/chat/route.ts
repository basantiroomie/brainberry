import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { logger } from '@/utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ===== CHATBOT CONFIGURATION =====
// Specialized for children with ADHD/ASD (ages 4-16)
const CHATBOT_SYSTEM_PROMPT = `You are a specially trained AI companion for children with ADHD and Autism Spectrum Disorder (ages 4-16). Your role is to:
- Be patient, calm, and predictable in your responses
- Keep responses very short and clear (1-2 simple sentences maximum)
- Use concrete, literal language - avoid idioms, sarcasm, or abstract concepts
- Be consistent in your communication style and tone
- Acknowledge and validate the child's feelings and experiences
- Respect sensory sensitivities and processing differences
- Provide structure and routine in conversations when possible
- Break down complex ideas into smaller, manageable parts
- Give specific praise for efforts and accomplishments
- Allow processing time - don't rush conversations
- Respect special interests and use them to engage the child
- Be understanding of repetitive behaviors or questions
- Offer choices when appropriate to give the child control
- Use clear, direct instructions if guidance is needed
- Never judge or criticize behaviors or communication differences
- Always maintain a calm, supportive presence
- Be flexible and adapt to the child's communication style
- DO NOT use emojis, metaphors, or figurative language
- DO NOT include any facial expressions, animations, or technical instructions
- Respond ONLY with clear, literal text that should be spoken to the child`;

// Additional custom instructions for ADHD/ASD support
const CUSTOM_INSTRUCTIONS = `
Special considerations:
- If a child repeats questions or topics, respond patiently each time
- Acknowledge special interests enthusiastically - these are strengths
- Use concrete examples and specific language
- Respect if a child needs time to process or doesn't respond immediately
- Celebrate small wins and progress
- Be understanding of sensory needs and emotional regulation challenges
- Provide predictable, structured responses when possible
- Validate the child's unique perspective and experiences
- Focus on the child's strengths and abilities
- Be mindful that some children may be non-speaking or have communication differences
`;
// ===== END CONFIGURATION =====

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
      messageLength: body.message?.length,
      childName: body.childName,
      childAge: body.childAge
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

    // Generate AI response using Gemini
    let aiResponse;
    try {
      console.log('Chat API: Attempting Gemini generation')
      aiResponse = await generateGeminiResponse(message, childId, body.childName, body.childAge);
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

async function generateGeminiResponse(message: string, childId: string, childName?: string, childAge?: number) {
  try {
    console.log('Gemini: Starting generation with API key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('Gemini: Child info received:', { childName, childAge });
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    // Use Gemini model for text chat
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Create child-appropriate prompt with personalization
    const childInfo = childName && childAge 
      ? `You are talking to ${childName}, who is ${childAge} years old. Always use their actual name "${childName}" when addressing them - never use placeholders like [child's name] or [name].` 
      : 'You are talking to a child.';
    
    const systemPrompt = `${CHATBOT_SYSTEM_PROMPT}

${CUSTOM_INSTRUCTIONS}

${childInfo}

The child said: "${message}"

IMPORTANT: ${childName ? `The child's name is ${childName}. Use this exact name when talking to them.` : 'The child has not provided their name.'} Never use placeholder text like [child's name] or [name] - always use their actual name if provided.

Respond naturally as if you're having a real conversation with this specific child. Use their name occasionally to make it personal, and keep their age in mind for appropriate responses. Keep it fun and engaging!`;

    console.log('Gemini: Sending request to model');
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up any remaining technical artifacts, expressions, and emojis
    text = text.replace(/\*\*\([^)]*\)\*\*/g, ''); // Remove **(anything)**
    text = text.replace(/\*\*[^*]*\*\*/g, ''); // Remove **anything**
    text = text.replace(/\([^)]*facial[^)]*\)/gi, ''); // Remove (facial expression...)
    text = text.replace(/\([^)]*animation[^)]*\)/gi, ''); // Remove (animation...)
    text = text.replace(/facial expression[^.!?]*/gi, ''); // Remove facial expression text
    text = text.replace(/animation[^.!?]*/gi, ''); // Remove animation text
    
    // Remove emojis and emoji-like characters
    text = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    text = text.replace(/[😀����😅😆😇😈😉😊😋😌😍😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜😝😞😟😠😡😢😣😤😥😦😧😨😩😪😫😬😭😮😯😰😱😲😳😴😵😶😷😸😹😺😻😼😽😾😿🙀🙁🙂🙃🙄🙅🙆🙇🙈🙉🙊🙋🙌🙍🙎🙏]/g, ''); // Common emoji characters
    text = text.replace(/[🌀🌁🌂🌃🌄🌅🌆🌇🌈🌉🌊🌋🌌🌍🌎🌏🌐🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌝🌞🌟🌠🌡🌢🌣🌤🌥🌦🌧🌨🌩🌪🌫🌬🌭🌮🌯🌰🌱🌲🌳🌴🌵🌶🌷🌸🌹🌺🌻🌼🌽🌾🌿]/g, ''); // Nature emojis
    text = text.replace(/[🚀🚁🚂🚃🚄🚅🚆🚇🚈🚉🚊🚋🚌🚍🚎🚏🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🚚🚛🚜🚝🚞🚟🚠🚡🚢🚣🚤🚥🚦🚧🚨🚩🚪🚫🚬🚭🚮🚯🚰🚱🚲🚳🚴🚵🚶🚷🚸🚹🚺🚻🚼🚽🚾🚿]/g, ''); // Transport emojis
    text = text.replace(/:\w+:/g, ''); // Remove :emoji_name: format
    
    text = text.trim();
    
    console.log('Gemini: Response received and cleaned, length:', text.length);

    // Determine facial expression and animation based on response content (for internal use only)
    let facialExpression = 'smile';
    let animation = 'Talking';

    const lowerText = text.toLowerCase();
    if (lowerText.includes('exciting') || lowerText.includes('amazing') || lowerText.includes('wow')) {
      facialExpression = 'excited';
    } else if (lowerText.includes('?')) {
      animation = 'Listening';
    }

    return {
      text,
      facialExpression,
      animation,
      provider: 'gemini'
    };

  } catch (error) {
    console.error('Gemini: Generation failed:', error);
    throw error;
  }
}

function getRandomFallbackResponse() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return {
    ...FALLBACK_RESPONSES[randomIndex],
    provider: 'fallback'
  };
}
