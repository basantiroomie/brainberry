import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { message, childId } = await req.json();

        // 1. Get text response from Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat({ history: [] }); // Add history for context
        const result = await chat.sendMessage(`You are a friendly companion to a child. Keep your answers short and encouraging. The child said: "${message}"`);
        const aiText = result.response.text();

        // This endpoint will return the text and let the client handle TTS and lip-sync.
        // This is the most robust way to use the browser's free TTS.
        return NextResponse.json({
            text: aiText,
            facialExpression: 'smile', // TODO: Enhance this with another Gemini call
            animation: 'Idle',
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
    }
}