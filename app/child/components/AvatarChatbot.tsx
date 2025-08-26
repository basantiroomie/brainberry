'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AvatarViewer } from '@/components/AvatarViewer';
import { Send, Mic } from 'lucide-react';

interface Message {
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChildProfile {
  id: string;
  name: string;
  avatar_url?: string;
}

interface AvatarChatbotProps {
  childProfile: ChildProfile;
}

export default function AvatarChatbot({ childProfile }: AvatarChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            from: 'bot',
            text: `Hi ${childProfile.name}! I'm your avatar friend. What would you like to talk about today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            setSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Try to find a child-friendly voice
            const voices = speechSynthesis.getVoices();
            const childVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('child') || 
                voice.name.toLowerCase().includes('female') ||
                voice.pitch > 1
            );
            
            if (childVoice) {
                utterance.voice = childVoice;
            }
            
            utterance.rate = 0.9;
            utterance.pitch = 1.2;
            utterance.volume = 0.8;
            
            utterance.onend = () => setSpeaking(false);
            utterance.onerror = () => setSpeaking(false);
            
            speechSynthesis.speak(utterance);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            from: 'user',
            text: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.text, childId: childProfile.id }),
            });

            if (res.ok) {
                const data = await res.json();
                const botMessage: Message = {
                    from: 'bot',
                    text: data.text,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
                
                // Speak the response
                speakText(data.text);
            } else {
                const errorMessage: Message = {
                    from: 'bot',
                    text: "I'm not sure how to respond to that. Can you try asking something else?",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                from: 'bot',
                text: "I'm having a little trouble talking right now. Let's try again!",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
        
    return (
        <div className="h-[calc(100vh-200px)] flex flex-col bg-white border-4 border-black shadow-brutal-xl">
            {/* Avatar Display */}
            <div className="flex-1 bg-gradient-to-b from-blue-50 to-purple-50 border-b-4 border-black relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    {childProfile.avatar_url ? (
                        <div className="w-full h-full max-w-md">
                            <AvatarViewer
                                avatarUrl={childProfile.avatar_url}
                                cameraMode="headshot"
                                enableControls={false}
                                className="w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <span className="text-4xl">🤖</span>
                            </div>
                            <p className="text-gray-600 font-bold">Avatar Loading...</p>
                        </div>
                    )}
                </div>
                
                {/* Speaking indicator */}
                {speaking && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 border-2 border-black shadow-brutal">
                        <div className="flex items-center space-x-2">
                            <Mic className="h-4 w-4" />
                            <span className="text-sm font-bold">Speaking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Messages */}
            <div className="h-48 overflow-y-auto p-4 bg-white border-b-4 border-black">
                <div className="space-y-3">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs px-4 py-2 border-2 border-black shadow-brutal font-bold text-sm ${
                                    message.from === 'user'
                                        ? 'bg-chart-2 text-white'
                                        : 'bg-chart-1 text-white'
                                }`}
                            >
                                {message.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 px-4 py-2 border-2 border-black shadow-brutal">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 p-3 border-2 border-black shadow-brutal font-bold text-sm"
                        placeholder={`Hi ${childProfile.name}! Type your message here...`}
                        disabled={loading}
                    />
                    <button 
                        onClick={handleSendMessage} 
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-chart-2 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-4 w-4" />
                        <span>SEND</span>
                    </button>
                </div>
            </div>
        </div>
    );
}