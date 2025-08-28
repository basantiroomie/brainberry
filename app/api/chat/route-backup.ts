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
    
    // Use Gemini model for text chat
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
- DO NOT use emojis in your response (they don't work well with text-to-speech)
- DO NOT include any facial expressions, animations, or technical instructions in your response
- Respond ONLY with the message text that should be spoken to the child

The child said: "${message}"

Respond naturally as if you're having a real conversation with the child. Keep it fun and engaging!`;

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
    
    // Use regular Gemini model for text chat
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Use Gemini TTS model for voice synthesis
    const ttsModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-tts",
      generationConfig: {
        temperature: 0.6,
        topK: 16,
        topP: 0.9,
        maxOutputTokens: 512,
      }
    });
    
    // Create child-appropriate prompt
    const systemPrompt = `You are a friendly, supportive AI companion for a child. Your role is to:
- Be encouraging, positive, and supportive
- Keep responses short and age-appropriate (1-2 sentences max)
- Use simple, clear language that children can understand
- Be curious about the child's interests and ask follow-up questions
- Provide gentle guidance when appropriate
- Never give medical, legal, or safety advice
- Always maintain a warm, caring tone
- DO NOT use emojis in your response (they don't work well with text-to-speech)
- DO NOT include any facial expressions, animations, or technical instructions in your response
- Respond ONLY with the message text that should be spoken to the child

The child said: "${message}"

Respond naturally as if you're having a real conversation with the child. Keep it fun and engaging!`;

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

    // Generate TTS audio using Gemini TTS API (fixed for audio-only response)
    let audioUrl = null;
    try {
      console.log('Gemini TTS: Generating audio for text chat');
      
      const ttsResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Say the following in a warm, friendly way for a child: '${text}'`
            }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"] // TTS model only supports AUDIO output
          }
        })
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        console.log('Gemini TTS: Audio generation successful');
        
        // TODO: Extract audio data from ttsData and convert to playable URL
        // The response should contain audio data that needs to be processed
        console.log('Gemini TTS response structure:', Object.keys(ttsData));
        
        audioUrl = null; // Audio extraction still needs implementation
        
        console.log('Gemini TTS: Audio extraction still pending - falling back to browser TTS');
      } else {
        const errorText = await ttsResponse.text();
        const errorData = JSON.parse(errorText);
        
        if (ttsResponse.status === 429) {
          console.log('Gemini TTS: Daily quota exceeded - using browser TTS fallback');
        } else {
          console.error('Gemini TTS: API request failed:', ttsResponse.status, errorText);
        }
        audioUrl = null;
      }
      
    } catch (ttsError) {
      console.error('Gemini TTS: Audio generation error:', ttsError);
      audioUrl = null;
    }

    // Determine facial expression and animation based on response content (for internal use only)
    const facialExpression = determineFacialExpression(text);
    const animation = determineAnimation(text);

    return {
      text,
      facialExpression,
      animation,
      audioUrl,
      model: 'gemini-2.0-flash-exp + gemini-tts',
      timestamp: new Date().toISOString()
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